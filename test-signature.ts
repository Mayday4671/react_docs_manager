import crypto from 'crypto';

// 你的实际数据
const appKey = '20522666';
const appSecret = 'rwMkoxLeyohN21VDK73a';
const path = '/artemis/api/irds/v2/resource/resourcesByParams';
const method = 'POST';

// 构建待签名字符串
const stringToSign = 
  `${method.toUpperCase()}\n` +
  `*/*\n` +
  `application/json\n` +
  `x-ca-key:${appKey}\n` +
  `${path}`;

console.log('待签名字符串:');
console.log(stringToSign);
console.log('\n待签名字符串（转义显示）:');
console.log(JSON.stringify(stringToSign));

// 使用 HMAC-SHA256 生成签名
const hmac = crypto.createHmac('sha256', appSecret);
hmac.update(stringToSign, 'utf8');
const signature = hmac.digest('base64');

console.log('\n生成的签名:', signature);

// 也尝试其他编码方式
const hmac2 = crypto.createHmac('sha256', appSecret);
hmac2.update(stringToSign);
const signature2 = hmac2.digest('base64');

console.log('生成的签名2:', signature2);

// 尝试 hex 编码
const hmac3 = crypto.createHmac('sha256', appSecret);
hmac3.update(stringToSign, 'utf8');
const signature3 = hmac3.digest('hex');

console.log('生成的签名(hex):', signature3);
