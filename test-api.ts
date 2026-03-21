// 测试API端点
async function testApi() {
  try {
    const response = await fetch('http://localhost:3001/api/hk-categories');
    const data = await response.json();
    
    console.log('API响应状态:', response.status);
    console.log('API响应数据:', JSON.stringify(data, null, 2));
    
    if (data.success && data.data) {
      console.log('\n分类数量:', data.data.length);
      console.log('第一个分类:', data.data[0]);
    }
  } catch (error) {
    console.error('测试失败:', error);
  }
}

testApi();
