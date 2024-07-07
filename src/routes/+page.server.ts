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
    const session = searchParams.get('session')
    if (sessionCookie && !session) {
        const session = await prisma.session.findFirst({
            where: {
                token: sessionCookie
            },
        })
        return redirect(307, '?session=' + session?.token)
    } else if (!sessionCookie && session) {
        cookies.set('session_id', session, {
            path: '/',
            httpOnly: true,
            sameSite: 'strict',
            secure: !dev,
            maxAge: 60 * 60 * 24 * 7 // one week
        })
        return redirect(307, '?session=' + session)
    }
    return {
        token: sessionCookie
    }
}

/** @type {import('./$types').Actions} */
export const actions = {

    submitname: async ({ event, request, cookies }) => {
        const data = await request.formData()
        console.log('datdataa', data)

        const token = uuidv4()

        const createdSession = await prisma.session.create({
            data: {
                token: token,
                user: {
                    create: {
                        email: data.get('email').toString()
                    }
                }
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

        console.log('token2', token)
        // return {
        //     token
        // }
        redirect(307, '?session=' + token)

    },
}