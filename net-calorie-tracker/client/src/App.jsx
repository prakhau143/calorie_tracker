import { useState } from 'react';
import { AppShell } from './components/AppShell.jsx';
import { UsersPage } from './pages/UsersPage.jsx';
import { UserTrackerPage } from './pages/UserTrackerPage.jsx';

export default function App() {
  const [selectedUserId, setSelectedUserId] = useState(null);

  return (
    <AppShell>
      {selectedUserId ? (
        <UserTrackerPage userId={selectedUserId} onBack={() => setSelectedUserId(null)} />
      ) : (
        <UsersPage onSelectUser={setSelectedUserId} />
      )}
    </AppShell>
  );
}
