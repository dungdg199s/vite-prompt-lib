import { useState } from "react";
import Button from "../shared/Button";
import Input from "../shared/Input";
import { uiClasses } from "../shared/uiClasses";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useWorkspace } from "../../hooks/useWorkspaces";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const ROLE_OPTIONS = [
  { value: "owner", label: "Owner" },
  { value: "manager", label: "Manager" },
  { value: "member", label: "Member" },
];

export default function WorkspaceDetail() {
  const location = useLocation();
  const navigate = useNavigate();
  const { workspaceId } = useParams();

  const { workspace, isLoading, members, isCreatingMember, isMemberBusy, createMember, updateMember, deleteMember } =
    useWorkspace(workspaceId);

  const [newMemberEmail, setNewMemberEmail] = useState("");
  const [newMemberRole, setNewMemberRole] = useState("member");
  const [memberFormError, setMemberFormError] = useState("");

  const handleAddMember = async (e) => {
    e.preventDefault();
    const email = newMemberEmail.trim();
    if (!EMAIL_RE.test(email)) {
      setMemberFormError("Enter a valid email address.");
      return;
    }
    setMemberFormError("");
    const result = await createMember({ email, role: newMemberRole });
    if (result) {
      setNewMemberEmail("");
      setNewMemberRole("member");
    }
  };

  const handleRoleChange = (email, role) => {
    updateMember(email, { role });
  };

  const handleRemoveMember = (email) => {
    if (!window.confirm(`Remove ${email} from this workspace?`)) {
      return;
    }
    deleteMember(email);
  };

  const historyFormat = (person, dateStr) => {
    if (!person) return "";
    if (!dateStr) return person;
    if (typeof dateStr === "string") {
      const d = new Date(dateStr);
      dateStr = d.toLocaleDateString() + " " + d.toLocaleTimeString();
    }
    return `${person}, ${dateStr}`;
  };

  const form =
    workspaceId && workspace
      ? workspace
      : {
          name: "Workspace",
          description: "Select a workspace or create a new one.",
        };

  const promptCount = form?.prompts?.length || 0;

  return (
    <section className={uiClasses.card}>
      <>
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Workspace</p>
              {form?.name || ""}
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              {form?.description || "Select a workspace or create a new one."}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              onClick={() =>
                navigate(`/workspaces/new`, {
                  state: { backgroundLocation: location },
                })
              }
              variant="secondary"
            >
              New Workspace
            </Button>
            <Button
              type="button"
              onClick={() =>
                navigate(`/workspaces/${workspaceId}/edit`, {
                  state: { backgroundLocation: location },
                })
              }
              disabled={isLoading || !workspaceId}
              variant="secondary"
            >
              Edit
            </Button>
            <Button
              type="button"
              variant="danger"
              onClick={() =>
                navigate(`/workspaces/${workspaceId}/delete`, {
                  state: { backgroundLocation: location },
                })
              }
              disabled={isLoading || !workspaceId}
            >
              Delete
            </Button>
          </div>
        </div>

        {workspaceId ? (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-xl border border-stone-200 bg-[#fffcf7] p-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Name</p>
              <p className="mt-1 text-sm font-medium text-slate-800">{form.name}</p>
            </div>
            <div className="rounded-xl border border-stone-200 bg-[#fffcf7] p-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Prompt Count</p>
              <p className="mt-1 text-sm font-medium text-slate-800">{promptCount}</p>
            </div>
            <div className="rounded-xl border border-stone-200 bg-[#fffcf7] p-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Owner</p>
              <p className="mt-1 text-sm font-medium text-slate-800">{form.owner || ""}</p>
            </div>
            <div className="rounded-xl border border-stone-200 bg-[#fffcf7] p-3 md:col-span-2 xl:col-span-4">
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                <div className="">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Create By</p>
                  <p className="mt-1 text-sm text-slate-700">{historyFormat(form.createdBy, form.createdAt)}</p>
                </div>
                <div className="">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Last Update</p>
                  <p className="mt-1 text-sm text-slate-700">{historyFormat(form.updatedBy, form.updatedAt)}</p>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-stone-200 bg-[#fffcf7] p-3 md:col-span-2 xl:col-span-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Members</p>

              <div className="mt-2 divide-y divide-stone-200 rounded-lg border border-stone-200 bg-white">
                {members.length === 0 ? (
                  <p className="px-3 py-2 text-sm text-slate-500">No members yet.</p>
                ) : (
                  members.map((member) => (
                    <div key={member.email} className="flex flex-wrap items-center gap-2 px-3 py-2">
                      <span className="min-w-[160px] flex-1 truncate text-sm font-medium text-slate-800">
                        {member.email}
                      </span>
                      <select
                        className="w-36 shrink-0 rounded-lg border border-stone-300 bg-white px-2 py-1.5 text-sm text-slate-800 outline-none transition focus:border-teal-700 focus:ring-2 focus:ring-teal-200 disabled:cursor-not-allowed disabled:bg-stone-100 disabled:text-slate-500"
                        value={member.role}
                        disabled={isMemberBusy(member.email)}
                        onChange={(e) => handleRoleChange(member.email, e.target.value)}
                      >
                        {ROLE_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                      <Button
                        variant="danger"
                        size="sm"
                        className="shrink-0"
                        disabled={isMemberBusy(member.email)}
                        onClick={() => handleRemoveMember(member.email)}
                      >
                        Remove
                      </Button>
                    </div>
                  ))
                )}
              </div>

              <form className="mt-3 flex flex-wrap items-end gap-2" onSubmit={handleAddMember}>
                <Input
                  label="Email"
                  type="text"
                  className="flex-1"
                  value={newMemberEmail}
                  onChange={(e) => setNewMemberEmail(e.target.value)}
                  error={memberFormError}
                  placeholder="name@example.com"
                  required
                />
                <Input
                  label="Role"
                  type="select"
                  value={newMemberRole}
                  onChange={(e) => setNewMemberRole(e.target.value)}
                  options={ROLE_OPTIONS}
                  required
                />
                <Button type="submit" variant="primary" disabled={isCreatingMember || !newMemberEmail.trim()}>
                  Add Member
                </Button>
              </form>
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-stone-300 bg-[#fffcf7] p-4 text-sm text-slate-600">
            No workspace selected.
          </div>
        )}
      </>
    </section>
  );
}
