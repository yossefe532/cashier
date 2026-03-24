import { Container, getRandom } from "@cloudflare/containers";

export class Backend extends Container {
  defaultPort = 8000;
  sleepAfter = "10m";
}

export default {
  async fetch(request, env) {
    const container = await getRandom(env.BACKEND, 1);
    await container.start();
    return container.fetch(request);
  },
};
