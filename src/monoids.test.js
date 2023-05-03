/** A moniod has to be both associative and have an identity function. It must also be a functor */

const identity = (x) => x

const Right = (val) => ({
  isLeft: false,
  val,
  concat: (other) => (other.isLeft ? other : Right(val.concat(other.val))),
  fold: (_, rightFunc) => rightFunc(val),
})

const Left = (val) => ({
  isLeft: true,
  val,
  concat: () => Left(val),
  fold: (leftFunc, _) => leftFunc(val),
})

it('Should concat Rights together', () => {
  expect(
    Right('Hello')
      .concat(Right(' '))
      .concat(Right('World'))
      .fold(identity, identity)
  ).toEqual(Right('Hello World').fold(identity, identity))
})
it('should only show the left if hitting a left', () => {
  expect(
    Right('Hello')
      .concat(Right(' '))
      .concat(Left('Error not hello world'))
      .concat(Right('World'))
      .fold(identity, identity)
  ).toEqual(Left('Error not hello world').fold(identity, identity))
})

class List extends Array {
  foldMap(type, identity) {
    return this.reduce((acc, curr) => acc.concat(type(curr)), identity)
  }
}

const DiscardLefts = (leftOrRight) => ({
  val: leftOrRight,
  concat: (other) =>
    DiscardLefts(
      other.val.isLeft ? leftOrRight : leftOrRight.concat(other.val)
    ),
  fold: (left, right) => leftOrRight.fold(left, right),
})
it('we can foldmap moniods with our own moniod to create new monoids', () => {
  const newMonoid = new List(
    Right('a'),
    Right('b'),
    Left('c'),
    Right('d')
  ).foldMap(DiscardLefts, DiscardLefts(Right('')))
  expect(newMonoid.fold(identity, identity)).toEqual('abd')
})

const Success = (x) => ({
  isFail: false,
  x,
  concat: (other) => (other.isFail ? other : Success(x)),
  fold: (_, success) => success(x),
})

const Fail = (x) => ({
  isFail: true,
  x,
  concat: (other) => (other.isFail ? Fail(x.concat(other.x)) : Fail(x)),
  fold: (fail, _) => fail(x),
})

const Validation = (run) => ({
  run,
  contramap: (fn) => Validation((x) => run(fn(x))),
  concat: (other) => Validation((obj) => run(obj).concat(other.run(obj))),
})
Validation.identity = () => Validation(() => Success())

const createValidation = ({ validation, error }) =>
  Validation((obj) => (validation(obj) ? Success(obj) : Fail([error])))

const createValidator = (validations) =>
  validations.reduce(
    (acc, curr) => acc.concat(createValidation(curr)),
    Validation.identity()
  )

describe('Validation', () => {
  const hasName = ({ name }) => !!name
  const isPamTask = ({ task }) => task === 'PAM'
  const isDailyTask = ({ shift }) => shift === 'DAILY'
  it('Foldmap to create a validations', () => {
    const validations = [
      { validation: hasName, error: 'Must have a name' },
      { validation: isPamTask, error: 'Must be a PAM task' },
      { validation: isDailyTask, error: 'Must be a daily task' },
    ]
    const task = { name: 'test', task: 'PAM', shift: 'DAILY' }
    const validated = new List(...validations).foldMap(
      ({ validation, error }) =>
        validation(task) ? Success(task) : Fail([error]),
      Success(task)
    )
    expect(validated.fold(identity, identity)).toEqual({
      name: 'test',
      shift: 'DAILY',
      task: 'PAM',
    })
  })
  const hasNameValidation = {
    validation: ({ name }) => !!name,
    error: 'Task must have a name',
  }
  const isPamTaskValidation = {
    validation: ({ task }) => task === 'PAM',
    error: 'Task be a PAM task',
  }
  const isDailyTaskValidation = {
    validation: ({ shift }) => shift === 'DAILY',
    error: 'Task must be DAILY',
  }
  const isSapSourceOfTruthValidation = {
    validation: ({ SOT }) => SOT === 'SAP',
    error: 'Is not a SAP source of truth',
  }
  it('using a new Validation monoid to wrap our functions', () => {
    const validations = [
      hasNameValidation,
      isPamTaskValidation,
      isDailyTaskValidation,
      isSapSourceOfTruthValidation,
    ]
    const task = { name: '', task: 'PAM', shift: 'WEEKLY', SOT: 'SAP' }
    const validated = createValidator(validations).run(task)

    expect(validated.fold(identity, identity)).toEqual([
      'Task must have a name',
      'Task must be DAILY',
    ])
  })
  it('Validations can be concatenated', () => {
    const canConcatValidations = createValidation(isPamTaskValidation)
      .concat(createValidation(isSapSourceOfTruthValidation))
      .concat(createValidation(hasNameValidation))
      .run({
        task: 'PAM',
        SOT: 'SAP',
      })
      .fold(identity, identity)
    expect(canConcatValidations).toEqual(['Task must have a name'])
  })
})
