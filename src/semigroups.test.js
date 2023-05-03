// A semigroup is associative and closed.
// closed means it always returns the same data type when operating with itself.
// addition would be a semigroup

// We can wrap values to make them a semigroup (they stay closed)
class List extends Array {
  foldMap(type) {
    console.log(this)
    return this.map(type).reduce(
      (acc, curr) => acc.concat(curr),
      type.identity()
    )
  }
}
;(arr) => ({
  foldMap: (type) =>
    arr.map(type).reduce((acc, curr) => acc.concat(curr), type.identity()),
})

const Sum = (x) => ({
  name: 'Sum',
  x,
  concat: (other) => Sum(other.x + x),
})
Sum.identity = () => Sum(0)

const Product = (x) => ({
  name: 'Product',
  x,
  concat: (other) => Product(other.x * x),
})
Product.identity = () => Product(1) // when you multiply 1 by anything you get that identity

const All = (x) => ({
  name: 'All',
  x,
  concat: (other) => All(other.x && x),
})
All.identity = () => All(true)

const Any = (x) => ({
  name: 'Any',
  x,
  concat: (other) => Any(other.x || x),
})
Any.identity = () => Any(false)

const Max = (x) => ({
  name: 'Max',
  x,
  concat: (other) => (other.x > x ? other : Max(x)),
})
Max.identity = () => Max(-Infinity)

const testCases = [
  {
    semigroup: Sum(3).concat(Sum(5).concat(Sum(3))),
    identitySemigroup: Sum.identity()
      .concat(Sum(3))
      .concat(Sum(5).concat(Sum(3))),
    expectedSemigroup: Sum(11),
  },
  {
    semigroup: Sum(3).concat(Sum(5)).concat(Sum(3)),
    identitySemigroup: Sum.identity()
      .concat(Sum(3))
      .concat(Sum(5))
      .concat(Sum(3)),
    expectedSemigroup: Sum(11),
  },
  {
    semigroup: Max(1).concat(Max(4)).concat(Max(5)).concat(Max(10)),
    identitySemigroup: Max.identity()
      .concat(Max(1))
      .concat(Max(4))
      .concat(Max(5))
      .concat(Max(10)),
    expectedSemigroup: Max(10),
  },
]

export const mockExpectedSemigroup = (expectedSemigroup) => ({
  ...expectedSemigroup,
  concat: expect.any(Function),
})

testCases.forEach(({ semigroup, expectedSemigroup, identitySemigroup }) => {
  it(`semigroups of ${semigroup.name} should be associative to equal ${semigroup.name}(${expectedSemigroup.x})`, () => {
    expect(semigroup).toEqual(mockExpectedSemigroup(expectedSemigroup))
  })
  it(`semigroups of ${semigroup.name} should have an identity to then equal ${semigroup.name}(${expectedSemigroup.x})`, () => {
    expect(identitySemigroup).toEqual(mockExpectedSemigroup(expectedSemigroup))
  })
})
it('foldmap folds an array into a type, then reduces it', () => {
  const arr = [1, 2, 3, 4]
  const concat = expect.any(Function)
  expect(new List(...arr).foldMap(Sum)).toMatchObject({ ...Sum(10), concat })
})
