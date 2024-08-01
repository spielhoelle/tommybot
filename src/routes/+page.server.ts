import { v4 as uuidv4 } from "uuid"
import { redirect } from "@sveltejs/kit"
/** @type {import('./$types').PageServerLoad} */
import type { ServerLoad, Actions } from "@sveltejs/kit"
import { PrismaClient, Prisma } from "@prisma/client"
import { dev } from "$app/environment"
import { fail } from "@sveltejs/kit"

const prisma = new PrismaClient()
export const load: ServerLoad = async ({
  cookies,
  depends,
}) => {
  depends("app:load")
  const sessionCookie = cookies.get("session_id")
  let token
  let messages = []
  let sessions = []

  if (sessionCookie) {
    const session = await prisma.session.findFirst({
      where: {
        token: sessionCookie,
      },
      include: {
        user: true,
        messages: true,
      },
    })
    sessions = await prisma.session.findMany({
      where: {
        userId: session?.userId,
      },
      include: {
        user: true,
        messages: true,
      },
    })
    token = session?.token
    messages = session?.messages
  }
  return {
    token,
    messages,
    sessions,
  }
}

/** @type {import('./$types').Actions} */
export const actions = {
  submitname: async ({ request, cookies }) => {
    const data = await request.formData()
    const email = data.get("email").toString()
    let token
    try {
      const existingUser = await prisma.user.findFirst({
        where: {
          email,
        },
        include: {
          sessions: true,
        },
      })
      if (existingUser) {
        token = existingUser.sessions[0].token
      } else {
        token = uuidv4()
        const createdSession = await prisma.session.create({
          data: {
            token,
            user: {
              create: {
                email,
                // name: data.get('name').toString(),
              },
            },
          },
        })
        console.log("New user and session:", createdSession)
      }
      cookies.set("session_id", token, {
        path: "/",
        httpOnly: true,
        sameSite: "strict",
        secure: !dev,
        maxAge: 60 * 60 * 24 * 7, // one week
      })
      return { success: true }
    } catch (error) {
      console.log("error", error)
      return fail(400, { email, alreadyExists: true })
    }
  },

  newSession: async ({ cookies, }) => {
    const sessionCookie = cookies.get("session_id")
    const token = uuidv4()
    const session = await prisma.session.findFirst({
      where: {
        token: sessionCookie,
      },
      include: {
        user: true,
      },
    })
    console.log('session', session)

    const createdSession = await prisma.session.create({
      data: {
        token,
        user: {
          connect: {
            id: session.userId
          }
        }
      },
    })


    console.log("New user and session:", createdSession)
    cookies.set("session_id", token, {
      path: "/",
      httpOnly: true,
      sameSite: "strict",
      secure: !dev,
      maxAge: 60 * 60 * 24 * 7, // one week
    })

    return { success: true }
  },
}
