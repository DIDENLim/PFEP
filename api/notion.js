export default async function handler(req, res) {
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

    if (action === 'test') {
      const response = await fetch(`https://api.notion.com/v1/databases/${NOTION_DATABASE_ID}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${NOTION_API_KEY}`,
          'Notion-Version': '2022-06-28'
        }
      });

      if (response.ok) {
        res.status(200).json({ success: true, message: '노션 연결 성공' });
      } else {
        const error = await response.text();
        res.status(400).json({ success: false, error: `API 오류: ${response.status}` });
      }
    } 
    else if (action === 'addOrder') {
      const notionData = {
        parent: { database_id: NOTION_DATABASE_ID },
        properties: {
          "내용": {
            title: [{ text: { content: `${data.partName} ${data.quantity}개` } }]
          },
          "날짜": {
            date: { start: new Date().toISOString().split('T')[0] }
          },
          "구매자": { select: { name: data.buyer } },
          "연구과제분류": { select: { name: data.project } },
          "구분": { select: { name: "연구재료비" } },
          "품목": { select: { name: "원재료" } },
          "금액": { number: data.price }
        }
      };

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
        res.status(200).json({ success: true, message: '노션에 성공적으로 기록됨' });
      } else {
        const error = await response.json();
        res.status(400).json({ success: false, error: error.message });
      }
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}
