// api/notion.js (오류 처리 개선)
export default async function handler(req, res) {
  // CORS 헤더 설정
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // OPTIONS 요청 처리 (CORS preflight)
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // POST 요청만 허용
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { action, data } = req.body;
    const NOTION_API_KEY = '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';
    const NOTION_DATABASE_ID = '25dcaf064f7f815582d1da758a2919cd';

    console.log(`[${new Date().toISOString()}] API 호출: ${action}`);

    if (action === 'test') {
      // 연결 테스트
      try {
        const response = await fetch(`https://api.notion.com/v1/databases/${NOTION_DATABASE_ID}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${NOTION_API_KEY}`,
            'Notion-Version': '2022-06-28'
          }
        });

        console.log('노션 API 응답 상태:', response.status);
        
        if (response.ok) {
          const dbInfo = await response.json();
          console.log('데이터베이스 정보:', dbInfo.title);
          res.status(200).json({ 
            success: true, 
            message: '노션 연결 성공',
            dbTitle: dbInfo.title?.[0]?.plain_text || '제목없음'
          });
        } else {
          const errorText = await response.text();
          console.error('노션 API 오류:', response.status, errorText);
          res.status(400).json({ 
            success: false, 
            error: `노션 API 오류 ${response.status}: ${errorText.substring(0, 200)}`
          });
        }
      } catch (fetchError) {
        console.error('네트워크 오류:', fetchError);
        res.status(500).json({
          success: false,
          error: `네트워크 오류: ${fetchError.message}`
        });
      }
    } 
    else if (action === 'addOrder') {
      // 주문 데이터 추가
      const notionData = {
        parent: {
          database_id: NOTION_DATABASE_ID
        },
        properties: {
          "내용": {
            title: [
              {
                text: {
                  content: `${data.partName} ${data.quantity}개`
                }
              }
            ]
          },
          "날짜": {
            date: {
              start: new Date().toISOString().split('T')[0]
            }
          },
          "구매자": {
            select: {
              name: data.buyer
            }
          },
          "연구과제분류": {
            select: {
              name: data.project
            }
          },
          "구분": {
            select: {
              name: "연구재료비"
            }
          },
          "품목": {
            select: {
              name: "원재료"
            }
          },
          "금액": {
            number: data.price
          }
        }
      };

      console.log('노션에 전송할 데이터:', JSON.stringify(notionData, null, 2));

      try {
        const response = await fetch('https://api.notion.com/v1/pages', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${NOTION_API_KEY}`,
            'Notion-Version': '2022-06-28',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(notionData)
        });

        if (response.ok) {
          const result = await response.json();
          console.log('노션 기록 성공:', result.id);
          res.status(200).json({ 
            success: true, 
            message: '노션에 성공적으로 기록됨',
            pageId: result.id
          });
        } else {
          const errorData = await response.json();
          console.error('노션 페이지 생성 오류:', errorData);
          res.status(400).json({ 
            success: false, 
            error: `노션 기록 실패: ${errorData.message}`,
            details: errorData
          });
        }
      } catch (fetchError) {
        console.error('노션 기록 네트워크 오류:', fetchError);
        res.status(500).json({
          success: false,
          error: `네트워크 오류: ${fetchError.message}`
        });
      }
    } 
    else {
      res.status(400).json({ error: 'Invalid action' });
    }
  } catch (error) {
    console.error('전체 서버 오류:', error);
    res.status(500).json({ 
      success: false, 
      error: `서버 오류: ${error.message}`
    });
  }
}
