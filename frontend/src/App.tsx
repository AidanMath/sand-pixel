import { GamePhaseRouter } from './components/game/GamePhaseRouter';
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
