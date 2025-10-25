import { testOpenAIConnection } from './openai';

async function test() {
  const isConnected = await testOpenAIConnection();
  console.log(isConnected ? '✅ Conectado correctamente' : '❌ Error de conexión');
}

test();