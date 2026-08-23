import { useCallback, useState } from 'react';
import { AppShell } from './components/AppShell.jsx';
import { UsersPage } from './pages/UsersPage.jsx';
import { UserTrackerPage } from './pages/UserTrackerPage.jsx';

export default function App() {
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [header, setHeader] = useState(null);

  const handleBack = useCallback(() => {
    setSelectedUserId(null);
    setHeader(null);
  }, []);

  return (
    <AppShell leading={header?.leading} title={header?.title}>
      {selectedUserId ? (
        <UserTrackerPage userId={selectedUserId} onBack={handleBack} onHeaderChange={setHeader} />
      ) : (
        <UsersPage onSelectUser={setSelectedUserId} />
      )}
    </AppShell>
  );
}
