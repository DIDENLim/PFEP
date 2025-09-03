// api/notion.js - 주문번호 자동 증가 기능 추가
export default async function handler(req, res) {
  // CORS 헤더 설정
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // OPTIONS 요청 처리
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // GET 요청 처리 (테스트용)
  if (req.method === 'GET') {
    return res.status(200).json({ 
      message: 'PFEP Notion API가 정상 작동 중입니다.',
      timestamp: new Date().toISOString()
    });
  }

  // POST 요청만 허용
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const NOTION_API_KEY = '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';
  const NOTION_DATABASE_ID = '25ecaf064f7f80da9a99e205b7190aa0';

  try {
    const { action, data } = req.body || {};
    console.log(`[${new Date().toISOString()}] Action: ${action}`);

    if (action === 'test') {
      // 노션 연결 테스트
      try {
        const response = await fetch(`https://api.notion.com/v1/databases/${NOTION_DATABASE_ID}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${NOTION_API_KEY}`,
            'Notion-Version': '2022-06-28',
            'Content-Type': 'application/json'
          }
        });

        const responseData = await response.json();

        if (response.ok) {
          console.log('[SUCCESS] 노션 데이터베이스 연결 성공');
          return res.status(200).json({ 
            success: true, 
            message: '노션 연결 성공!',
            database: responseData.title?.[0]?.plain_text || 'PFEP 데이터베이스'
          });
        } else {
          console.error('[ERROR] 노션 API 오류:', response.status, responseData);
          return res.status(200).json({ 
            success: false, 
            error: `노션 API 오류: ${response.status} - ${responseData.message || 'Unknown error'}`
          });
        }
      } catch (fetchError) {
        console.error('[ERROR] 노션 연결 실패:', fetchError);
        return res.status(200).json({ 
          success: false, 
          error: `연결 오류: ${fetchError.message}`
        });
      }
    } 
    else if (action === 'addOrder') {
      // 주문 데이터 검증
      if (!data) {
        return res.status(400).json({ 
          success: false, 
          error: '주문 데이터가 없습니다' 
        });
      }

      // 안전한 데이터 추출
      const partName = data.partName || '알 수 없는 부품';
      const quantity = parseInt(data.quantity) || 100;
      const price = parseInt(data.price) || 0;
      const buyer = data.buyer || '임석균';
      const project = data.project || '조선3사';

      console.log('[INFO] 주문 데이터:', { partName, quantity, price, buyer, project });

      try {
        // 1단계: 기존 주문번호 중 최댓값 조회
        console.log('[INFO] 기존 주문번호 조회 중...');
        
        const queryResponse = await fetch(`https://api.notion.com/v1/databases/${NOTION_DATABASE_ID}/query`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${NOTION_API_KEY}`,
            'Notion-Version': '2022-06-28',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            sorts: [
              {
                property: "번호",
                direction: "descending"
              }
            ],
            page_size: 1
          })
        });

        let nextOrderNumber = 1; // 기본값

        if (queryResponse.ok) {
          const queryData = await queryResponse.json();
          console.log('[INFO] 쿼리 결과:', queryData.results.length, '건');
          
          if (queryData.results && queryData.results.length > 0) {
            const lastEntry = queryData.results[0];
            const lastTitle = lastEntry.properties?.['번호']?.title?.[0]?.text?.content || '';
            console.log('[INFO] 마지막 제목:', lastTitle);
            
            // 제목에서 숫자 추출 (예: "5" 또는 "주문-5" 등에서 5 추출)
            const numberMatch = lastTitle.match(/\d+/);
            if (numberMatch) {
              const lastNumber = parseInt(numberMatch[0]);
              nextOrderNumber = lastNumber + 1;
              console.log('[INFO] 다음 주문번호:', nextOrderNumber);
            }
          }
        } else {
          console.log('[WARNING] 기존 데이터 조회 실패, 주문번호 1부터 시작');
        }

        // 2단계: 새 주문 데이터 생성
        const notionData = {
          parent: {
            database_id: NOTION_DATABASE_ID
          },
          properties: {
            "번호": {
              title: [
                {
                  text: {
                    content: nextOrderNumber.toString()
                  }
                }
              ]
            },
            "날짜": {
              rich_text: [
                {
                  text: {
                    content: new Date().toLocaleDateString('ko-KR')
                  }
                }
              ]
            },
            "구매자": {
              rich_text: [
                {
                  text: {
                    content: buyer
                  }
                }
              ]
            },
            "연구과제분류": {
              rich_text: [
                {
                  text: {
                    content: project
                  }
                }
              ]
            },
            "구분": {
              rich_text: [
                {
                  text: {
                    content: "연구재료비"
                  }
                }
              ]
            },
            "품목": {
              rich_text: [
                {
                  text: {
                    content: "원재료"
                  }
                }
              ]
            },
            "내용": {
              rich_text: [
                {
                  text: {
                    content: `${partName} ${quantity}개`
                  }
                }
              ]
            },
            "구매처": {
              rich_text: [
                {
                  text: {
                    content: "쉬멕스"
                  }
                }
              ]
            },
            "결제금액": {
              rich_text: [
                {
                  text: {
                    content: `${price.toLocaleString()}원`
                  }
                }
              ]
            }
          }
        };

        // 3단계: 노션에 새 주문 추가
        console.log('[INFO] 노션에 주문번호', nextOrderNumber, '기록 중...');
        
        const response = await fetch('https://api.notion.com/v1/pages', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${NOTION_API_KEY}`,
            'Notion-Version': '2022-06-28',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(notionData)
        });

        const responseData = await response.json();

        if (response.ok) {
          console.log('[SUCCESS] 노션 기록 성공! 주문번호:', nextOrderNumber, 'Page ID:', responseData.id);
          return res.status(200).json({ 
            success: true, 
            message: `주문번호 ${nextOrderNumber}번으로 노션에 성공적으로 기록되었습니다!`,
            pageId: responseData.id,
            orderNumber: nextOrderNumber,
            url: responseData.url
          });
        } else {
          console.error('[ERROR] 노션 기록 실패:', response.status, responseData);
          return res.status(200).json({ 
            success: false, 
            error: `노션 기록 실패: ${responseData.message || response.status}`,
            details: responseData
          });
        }
      } catch (fetchError) {
        console.error('[ERROR] API 호출 오류:', fetchError);
        return res.status(200).json({ 
          success: false, 
          error: `API 호출 오류: ${fetchError.message}`
        });
      }
    } 
    else {
      return res.status(400).json({ 
        success: false, 
        error: `지원하지 않는 액션: ${action}` 
      });
    }

  } catch (globalError) {
    console.error('[GLOBAL ERROR]:', globalError);
    return res.status(500).json({ 
      success: false, 
      error: `서버 오류: ${globalError.message}`,
      stack: process.env.NODE_ENV === 'development' ? globalError.stack : undefined
    });
  }
}
