// src/hooks.server.ts
import type { Handle } from "@sveltejs/kit";
import { PrismaClient, Prisma } from "@prisma/client";
const prisma = new PrismaClient();

export const handle: Handle = async ({ event, resolve }) => {
  const sessionCookie = event.cookies.get("session_id");
  if (!sessionCookie) {
    return await resolve(event);
  }
  try {
    if (sessionCookie) {
      const session = await prisma.session.findFirst({
        where: {
          token: sessionCookie,
        },
		include: {
			user: true,
		},
      });
	  const user = session.user
      if (user) {
        event.locals.user = {
          id: user.id,
          email: user.email,
          session: sessionCookie
        };
      } else {
        event.locals.user = null;
      }
    } else {
      event.locals.user = null;
    }
    return resolve(event);
  } catch (error) {
    console.log("Internal Error:", error);
  }
  const response = await resolve(event);
  return response;
};
