import Redis from 'ioredis';
const redis = new Redis('redis://localhost:6379');
redis.ping().then(res => {
  console.log('Redis Ping:', res);
  process.exit(0);
}).catch(err => {
  console.error('Redis Error:', err);
  process.exit(1);
});
