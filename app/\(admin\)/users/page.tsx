import pool from "@/lib/db";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { PlanBadge } from "@/components/billing/PlanBadge";
import type { PlanId } from "@/lib/plans";
import { MoreVertical, Search, Mail, Clock, CalendarCheck } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { InviteUserDialog } from "@/components/admin/InviteUserDialog";
import { UserRole } from "@/lib/constants";

async function getUsers() {
  const result = await pool.query(`
    SELECT id, name, email, plan, role, ls_customer_id, trial_expires_at, invited_at,
    (SELECT COUNT(*) FROM sites WHERE user_id = users.id) as site_count
    FROM users 
    ORDER BY created_at DESC
  `);
  return result.rows;
}

export default async function AdminUsersPage() {
  const users = await getUsers();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">User Management</h1>
          <p className="text-slate-500 mt-1">Manage platform users and their subscription plans.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input 
              placeholder="Search users..." 
              className="pl-9 w-64 bg-white border-slate-200"
            />
          </div>
          <InviteUserDialog />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow>
              <TableHead className="font-semibold text-slate-900">User</TableHead>
              <TableHead className="font-semibold text-slate-900">Plan</TableHead>
              <TableHead className="font-semibold text-slate-900 text-center">Sites</TableHead>
              <TableHead className="font-semibold text-slate-900">Trial Status</TableHead>
              <TableHead className="font-semibold text-slate-900">Role</TableHead>
              <TableHead className="w-10"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id} className="hover:bg-slate-50/50 transition-colors">
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-medium">
                      {user.name?.[0]?.toUpperCase() ?? user.email?.[0]?.toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{user.name || 'N/A'}</p>
                      <div className="flex items-center gap-1 text-xs text-slate-500">
                        <Mail className="w-3 h-3" />
                        {user.email}
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <PlanBadge plan={user.plan as PlanId} />
                </TableCell>
                <TableCell className="text-center">
                  <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-slate-100 text-xs font-bold text-slate-700 border border-slate-200">
                    {user.site_count}
                  </span>
                </TableCell>
                <TableCell>
                  {user.trial_expires_at ? (
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-1.5 text-xs font-medium text-amber-600">
                        <Clock className="w-3.5 h-3.5" />
                        到期: {new Date(user.trial_expires_at).toLocaleDateString()}
                      </div>
                      {user.invited_at && (
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                          <CalendarCheck className="w-3 h-3" />
                          已受邀加入
                        </div>
                      )}
                    </div>
                  ) : (
                    <span className="text-xs text-slate-400">—</span>
                  )}
                </TableCell>
                <TableCell>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                    user.role === UserRole.SUPER_ADMIN ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {user.role}
                  </span>
                </TableCell>
                <TableCell>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
