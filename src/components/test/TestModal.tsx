'use client'

import React, { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

export function TestModal() {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant='outline'>Abrir Modal de Prueba</Button>
      </DialogTrigger>
      <DialogContent showCloseButton={true}>
        <DialogHeader>
          <DialogTitle>Modal de Prueba</DialogTitle>
        </DialogHeader>
        <div className='p-4'>
          <p>
            Este es un modal de prueba para verificar que el botón de cerrar funciona correctamente.
          </p>
          <Button onClick={() => setOpen(false)} className='mt-4'>
            Cerrar con botón
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
