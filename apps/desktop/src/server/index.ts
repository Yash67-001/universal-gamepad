import { HostService } from './hostService';

const port = parseInt(process.env.PORT || '8080', 10);
const hostService = new HostService(port);

hostService.start().catch((err) => {
  console.error('Failed to start Universal Gamepad Host Service:', err);
  process.exit(1);
});
