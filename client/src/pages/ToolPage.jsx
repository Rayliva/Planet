import { useParams, Link } from 'react-router-dom';

import MasterList from '../components/tools/MasterList/MasterList.jsx';
import Bingo from '../components/tools/Bingo/Bingo.jsx';
import WheelOfTodos from '../components/tools/WheelOfTodos/WheelOfTodos.jsx';
import BetOnYourself from '../components/tools/BetOnYourself/BetOnYourself.jsx';
import JarOfMarbles from '../components/tools/JarOfMarbles/JarOfMarbles.jsx';
import Pomodoro from '../components/tools/Pomodoro/Pomodoro.jsx';
import Calendar from '../components/tools/Calendar/Calendar.jsx';
import BossBattle from '../components/tools/BossBattle/BossBattle.jsx';
import TaskGarden from '../components/tools/TaskGarden/TaskGarden.jsx';
import FocusFortress from '../components/tools/FocusFortress/FocusFortress.jsx';
import DiceRoll from '../components/tools/DiceRoll/DiceRoll.jsx';
import VentVoid from '../components/tools/VentVoid/VentVoid.jsx';
import Breathing from '../components/tools/Breathing/Breathing.jsx';
import Soundscape from '../components/tools/Soundscape/Soundscape.jsx';
import DoodlePad from '../components/tools/DoodlePad/DoodlePad.jsx';
import Affirmations from '../components/tools/Affirmations/Affirmations.jsx';
import StretchTimer from '../components/tools/StretchTimer/StretchTimer.jsx';
import MindfulMinute from '../components/tools/MindfulMinute/MindfulMinute.jsx';

const tools = {
  'master-list': MasterList,
  bingo: Bingo,
  wheel: WheelOfTodos,
  bet: BetOnYourself,
  jar: JarOfMarbles,
  pomodoro: Pomodoro,
  calendar: Calendar,
  boss: BossBattle,
  garden: TaskGarden,
  fortress: FocusFortress,
  dice: DiceRoll,
  void: VentVoid,
  breathing: Breathing,
  soundscape: Soundscape,
  doodle: DoodlePad,
  affirmations: Affirmations,
  stretch: StretchTimer,
  mindful: MindfulMinute,
};

export default function ToolPage() {
  const { toolId } = useParams();
  const ToolComponent = tools[toolId];

  if (!ToolComponent) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center">
        <span className="text-6xl block mb-4">🪐</span>
        <h1 className="text-2xl font-bold text-ink mb-2">Tool not found</h1>
        <p className="text-ink-muted mb-6">This corner of the universe is still unexplored.</p>
        <Link to="/" className="inline-block px-6 py-2.5 rounded-btn bg-ink text-white font-medium hover:opacity-90 transition no-underline">
          Back to Home
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      <ToolComponent />
    </div>
  );
}
