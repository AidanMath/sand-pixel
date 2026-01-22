import { GamePhaseRouter } from './components/GamePhaseRouter';
import { ErrorToast } from './components/ErrorToast';

function App() {
  return (
    <>
      <GamePhaseRouter />
      <ErrorToast />
    </>
  );
}

export default App;
