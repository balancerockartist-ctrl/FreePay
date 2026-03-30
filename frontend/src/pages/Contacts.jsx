import { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { UserPlus } from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

function getInitials(name) {
  return name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

const AVATAR_COLORS = [
  "bg-blue-500", "bg-green-500", "bg-purple-500", "bg-orange-500",
  "bg-pink-500", "bg-teal-500", "bg-red-500", "bg-indigo-500",
];

function avatarColor(name) {
  let hash = 0;
  for (const ch of name) hash = (hash * 31 + ch.charCodeAt(0)) % AVATAR_COLORS.length;
  return AVATAR_COLORS[Math.abs(hash)];
}

export default function Contacts() {
  const { currentUser } = useCurrentUser();
  const [users, setUsers] = useState([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchUsers = () =>
    axios.get(`${API}/users`).then((r) => setUsers(r.data)).catch(console.error);

  useEffect(() => { fetchUsers(); }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post(`${API}/users`, { name, email });
      toast.success(`Contact "${name}" added!`);
      setName("");
      setEmail("");
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to add contact");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">Contacts</h2>
        <p className="text-gray-500 text-sm mt-1">Everyone on FreePay</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Contact list */}
        <div className="lg:col-span-2">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-base font-semibold text-gray-700">
                All Users ({users.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {users.length === 0 ? (
                <p className="text-gray-400 text-sm p-6">No users yet.</p>
              ) : (
                <ul className="divide-y divide-gray-100">
                  {users.map((u) => (
                    <li key={u.id} className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition-colors">
                      <Avatar>
                        <AvatarFallback className={`${avatarColor(u.name)} text-white text-sm font-semibold`}>
                          {getInitials(u.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-gray-800 truncate">{u.name}</p>
                          {currentUser?.id === u.id && (
                            <span className="text-xs bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded font-medium">You</span>
                          )}
                        </div>
                        <p className="text-sm text-gray-400 truncate">{u.email}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-bold text-green-600">${u.balance.toFixed(2)}</p>
                        <p className="text-xs text-gray-400">balance</p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Add contact */}
        <div>
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-base font-semibold text-gray-700 flex items-center gap-2">
                <UserPlus size={16} /> Add Contact
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAdd} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="cname">Full Name</Label>
                  <Input
                    id="cname"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Alice Smith"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="cemail">Email</Label>
                  <Input
                    id="cemail"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="alice@example.com"
                    required
                  />
                </div>
                <p className="text-xs text-gray-400">New accounts start with $1,000 balance.</p>
                <Button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700 gap-2"
                  disabled={loading}
                >
                  <UserPlus size={15} />
                  {loading ? "Adding…" : "Add Contact"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
