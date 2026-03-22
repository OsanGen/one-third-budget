import Button from '@/components/ui/Button';

export type NextMoveStateKey =
  | 'no-revenue'
  | 'revenue-no-amount'
  | 'under-cap'
  | 'close-to-cap'
  | 'over-cap'
  | 'snapshot-saved';

export type TargetSection = 'money-in' | 'buckets' | 'saved-months';

export type NextMoveCoachModel = {
  key: NextMoveStateKey;
  title: string;
  body: string;
  actionLabel: string;
  target: TargetSection;
};

type ProgressStep = {
  id: string;
  label: string;
  done: boolean;
  active: boolean;
};

const progressSteps = [
  { id: 'money-in', label: 'Money in' },
  { id: 'buckets', label: 'Buckets' },
  { id: 'saved-months', label: 'Save month' },
];

type NextMoveCoachProps = {
  model: NextMoveCoachModel;
  onAction: (target: TargetSection) => void;
  stepState: {
    moneyDone: boolean;
    bucketsDone: boolean;
    savedDone: boolean;
    nextStep: 0 | 1 | 2;
  };
};

export default function NextMoveCoach({ model, onAction, stepState }: NextMoveCoachProps) {
  const { moneyDone, bucketsDone, savedDone, nextStep } = stepState;

  const visibleSteps: ProgressStep[] = progressSteps.map((step, index) => ({
    ...step,
    done: index === 0 ? moneyDone : index === 1 ? bucketsDone : savedDone,
    active: index === nextStep,
  }));

  return (
    <section className="next-move-coach">
      <ol className="progress-strip" aria-label="Three step progress">
        {visibleSteps.map((step) => (
          <li key={step.id} className="progress-step" aria-current={step.active ? 'step' : undefined}>
            <span
              className={`progress-dot ${step.done ? 'is-done' : ''} ${step.active ? 'is-active' : ''}`}
              aria-hidden="true"
            >
              {step.done ? '✓' : ''}
            </span>
            <span className="progress-label">
              {step.label}
              <span className="sr-only">
                {step.done ? ' done' : step.active ? ' current' : ' not complete'}
              </span>
            </span>
          </li>
        ))}
      </ol>

      <div className="next-move-copy">
        <p className="next-move-title">{model.title}</p>
        <p className="next-move-body">{model.body}</p>
      </div>

      <Button
        className="next-move-button"
        type="button"
        onClick={() => onAction(model.target)}
        aria-label={`${model.actionLabel}, go to ${model.target.replace('-', ' ')} section`}
      >
        {model.actionLabel}
      </Button>
    </section>
  );
}
