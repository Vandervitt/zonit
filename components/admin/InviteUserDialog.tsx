"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UserPlus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { PLANS, PlanId } from "@/lib/plans";

export function InviteUserDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [plan, setPlan] = useState<PlanId>("pro");
  const [duration, setDuration] = useState("15");

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const res = await fetch("/api/admin/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          plan,
          duration_days: parseInt(duration),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to send invitation");
      }

      toast.success("邀请已发送！邮件正在派送中。");
      setIsOpen(false);
      setEmail("");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="bg-indigo-600 hover:bg-indigo-700 gap-2">
          <UserPlus className="w-4 h-4" />
          邀请用户
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleInvite}>
          <DialogHeader>
            <DialogTitle>发送专属邀请</DialogTitle>
            <DialogDescription>
              向用户发送包含限时权益的注册链接。用户注册后将自动获得对应计划。
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="email">用户邮箱</Label>
              <Input
                id="email"
                type="email"
                placeholder="user@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="plan">赠送权益</Label>
                <Select value={plan} onValueChange={(v) => setPlan(v as PlanId)}>
                  <SelectTrigger id="plan">
                    <SelectValue placeholder="选择计划" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(PLANS).map(([id, config]) => (
                      <SelectItem key={id} value={id}>
                        {config.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="duration">权益时长 (天)</Label>
                <Input
                  id="duration"
                  type="number"
                  min="1"
                  max="365"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  required
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-indigo-600 hover:bg-indigo-700"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  发送中...
                </>
              ) : (
                "确认并发送邀请"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
