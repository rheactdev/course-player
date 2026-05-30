import { NextRequest, NextResponse } from 'next/server'
import { addGlobalTag, removeGlobalTag } from '@/lib/server/tags'

export async function POST(request: NextRequest) {
  try {
    const { tag } = await request.json()
    if (!tag || typeof tag !== 'string') {
      return NextResponse.json({ error: 'Invalid tag' }, { status: 400 })
    }

    const created = addGlobalTag(tag)
    if (!created) {
      return NextResponse.json({ error: 'Invalid tag' }, { status: 400 })
    }

    return NextResponse.json({ success: true, tag: created })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { tag } = await request.json()
    if (!tag || typeof tag !== 'string') {
      return NextResponse.json({ error: 'Invalid tag' }, { status: 400 })
    }

    removeGlobalTag(tag)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
