// api/notion.js (컬럼명 수정 완료!)
export default async function handler(req, res) {
  // CORS 헤더 설정
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { action, data } = req.body;
    const NOTION_API_KEY = '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';
    const NOTION_DATABASE_ID = '25dcaf064f7f815582d1da758a2919cd';

    console.log(`[API] 요청: ${action}`);

    if (action === 'test') {
      try {
        const response = await fetch(`https://api.notion.com/v1/databases/${NOTION_DATABASE_ID}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${NOTION_API_KEY}`,
            'Notion-Version': '2022-06-28'
          }
        });

        if (response.ok) {
          const dbInfo = await response.json();
          console.log('[SUCCESS] 노션 데이터베이스 연결 성공');
          
          return res.status(200).json({ 
            success: true, 
            message: '노션 연결 성공!',
            dbTitle: dbInfo.title?.[0]?.plain_text || 'PFEP 테스트',
            columns: Object.keys(dbInfo.properties)
          });
        } else {
          const errorText = await response.text();
          console.error('[ERROR] 노션 API 오류:', response.status, errorText);
          
          return res.status(200).json({ 
            success: false, // api/notion.js (정확한 컬럼명으로 최종 수정!)
export default async function handler(req, res) {
  // CORS 헤더 설정
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { action, data } = req.body;
    const NOTION_API_KEY = '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';
    const NOTION_DATABASE_ID = '25dcaf064f7f815582d1da758a2919cd';

    console.log(`[API] ${action} 요청 받음`);

    if (action === 'test') {
      // 노션 연결 테스트
      try {
        const response = await fetch(`https://api.notion.com/v1/databases/${NOTION_DATABASE_ID}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${NOTION_API_KEY}`,
            'Notion-Version': '2022-06-28'
          }
        });

        if (response.ok) {
          const dbInfo = await response.json();
          console.log('[SUCCESS] 노션 데이터베이스 연결 성공!');
          
          return res.status(200).json({ 
            success: true, 
            message: '노션 연결 성공!',
            dbTitle: dbInfo.title?.[0]?.plain_text || 'PFEP 테스트'
          });
        } else {
          console.error('[ERROR] 노션 API 오류:', response.status);
          return res.status(200).json({ 
            success: false, 
            error: `노션 연결 실패: ${response.status}`
          });
        }
      } catch (error) {
        console.error('[ERROR] 연결 오류:', error);
        return res.status(200).json({
          success: false,
          error: `연결 오류: ${error.message}`
        });
      }
    }
    else if (action === 'addOrder') {
      console.log('[API] 노션에 주문 데이터 추가 시작');
      
      // 실제 노션 컬럼명에 정확히 맞춘 데이터 구성
      const notionData = {
        parent: {
          database_id: NOTION_DATABASE_ID
        },
        properties: {
          "번호": {
            title: [
              {
                text: {
                  content: `${data.partName} ${data.quantity}개 주문`
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
          "내용": {
            rich_text: [
              {
                text: {
                  content: `${data.partName} ${data.quantity}개`
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
            number: data.price
          }
        }
      };

      console.log('[API] 노션 전송 데이터 준비 완료');

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
          console.log('[SUCCESS] 노션 기록 성공! 페이지 ID:', result.id);
          
          return res.status(200).json({ 
            success: true, 
            message: '노션에 성공적으로 기록됨!',
            pageId: result.id
          });
        } else {
          const errorData = await response.json();
          console.error('[ERROR] 노션 기록 실패:', errorData);
          
          return res.status(200).json({ 
            success: false, 
            error: `기록 실패: ${errorData.message || response.status}`,
            details: errorData
          });
        }
      } catch (error) {
        console.error('[ERROR] API 호출 오류:', error);
        return res.status(200).json({
          success: false,
          error: `API 오류: ${error.message}`
        });
      }
    }
    else {
      return res.status(400).json({ error: 'Invalid action' });
    }
  } catch (error) {
    console.error('[ERROR] 서버 오류:', error);
    return res.status(500).json({ 
      success: false, 
      error: `서버 오류: ${error.message}`
    });
  }
}
