import { v4 as uuidv4 } from 'uuid'
import { redirect } from '@sveltejs/kit'
/** @type {import('./$types').PageServerLoad} */
import type { ServerLoad, Actions } from '@sveltejs/kit'
import { PrismaClient, Prisma } from '@prisma/client'
import { dev } from '$app/environment'

const prisma = new PrismaClient()
export const load: ServerLoad = async ({ locals, url, cookies }) => {
    const sessionCookie = cookies.get('session_id')
    const searchParams = url.searchParams
    let token
    if (sessionCookie && !searchParams.get('session')) {
        const session = await prisma.session.findFirst({
            where: {
                token: sessionCookie
            },
        })
        token = session?.token
        redirect(307, '?session=' + session?.token)
    } else if (!searchParams.get('session')) {
        token = uuidv4()

        const createdSession = await prisma.session.create({
            data: {
                token: token
            }
        })
        console.log('Created new session', createdSession)

        cookies.set('session_id', token, {
            path: '/',
            httpOnly: true,
            sameSite: 'strict',
            secure: !dev,
            maxAge: 60 * 60 * 24 * 7 // one week
        })

        redirect(307, '?session=' + token)
    } else {
        token = searchParams.get('session')
    }

    return {
        token
    }

    // return {
    //     messages: [],
    //     token: ""
    // }
}
