import React from 'react';
import ComplaintForm from './form/ComplaintForm';
import AICopilot from './copilot/AICopilot';

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    height: 'calc(100vh - 64px)',
    overflow: 'hidden',
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  mainContent: {
    display: 'flex',
    flex: 1,
    overflow: 'hidden',
  },
};

const App: React.FC = () => {
  return (
    <div style={styles.container}>
      <div style={styles.mainContent}>
        <ComplaintForm />
        <div style={{ width: '480px', borderLeft: '1px solid #e8e8e8' }}>
          <AICopilot />
        </div>
      </div>
    </div>
  );
};

export default App;