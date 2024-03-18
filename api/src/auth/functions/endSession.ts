import { HttpRequest, HttpResponseInit, InvocationContext, app } from '@azure/functions';
import { appEnvironment } from '../../appEnvironment';
import { getStringValue } from '../../common/util/form';
import { deleteSessionEntity } from '../infrastructure/persistence/session';

export async function endSession(request: HttpRequest, _context: InvocationContext): Promise<HttpResponseInit> {
  const sessionContainer = await appEnvironment.get('sessionContainer');

  const formData = await request.formData();

  const sessionId = getStringValue(formData, 'sessionId');

  await deleteSessionEntity(sessionContainer, sessionId);

  return {
    status: 204
  };
};

app.http('endSession', {
  methods: ['POST'],
  authLevel: 'anonymous',
  handler: endSession
});
