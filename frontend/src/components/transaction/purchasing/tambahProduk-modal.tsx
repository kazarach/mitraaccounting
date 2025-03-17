import { DialogClose, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@radix-ui/react-label'
import { Copy } from 'lucide-react'
import React from 'react'
import { Button } from '@/components/ui/button';

const TambahProdukModal = () => {
  return (
    <div>
      <DialogHeader>
        <DialogTitle>Tambah Produk</DialogTitle>
        <DialogDescription>
          Anyone who has this link will be able to view this.
        </DialogDescription>
      </DialogHeader>
      <div className="flex items-center space-x-2">
        
      </div>
      <DialogFooter className="sm:justify-start">
        
      </DialogFooter>
    </div>
  )
}

export default TambahProdukModal
