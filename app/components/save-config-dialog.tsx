"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { SaveableMetadata } from "../types"

type SaveConfigDialogProps = {
  metadata: SaveableMetadata
}

export function SaveConfigDialog({ metadata }: SaveConfigDialogProps) {
  const [configName, setConfigName] = useState("")
  const [isOpen, setIsOpen] = useState(false)

  const handleSave = () => {
    if (configName) {
      localStorage.setItem("savedGameConfig", JSON.stringify({ ...metadata, name: configName }))
      setIsOpen(false)
      setConfigName("")
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">Save Configuration</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Save Game Configuration</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="configName" className="text-right">
              Name
            </Label>
            <Input
              id="configName"
              value={configName}
              onChange={(e) => setConfigName(e.target.value)}
              className="col-span-3"
            />
          </div>
        </div>
        <Button onClick={handleSave}>Save Configuration</Button>
      </DialogContent>
    </Dialog>
  )
}

