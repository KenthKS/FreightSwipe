import React, { useState, useMemo } from 'react'
import { useSprings, animated, to as interpolate } from '@react-spring/web'
import { useDrag } from '@use-gesture/react'
import { Link } from 'react-router-dom'

const to = (i) => ({
  x: 0,
  y: i * -4,
  scale: 1,
  rot: 0,
  delay: i * 100,
})
const from = (_i) => ({ x: 0, rot: 0, scale: 1.5, y: -1000 })
const trans = (r, s) =>
  `perspective(1500px) rotateX(30deg) rotateY(${r / 10}deg) rotateZ(${r}deg) scale(${s})`

function Deck({ data, onSwipe }) {
  const [gone] = useState(() => new Set())
  const [props, api] = useSprings(data.length, i => ({
    ...to(i),
    from: from(i),
  }))

  const childRefs = useMemo(() => Array(data.length).fill(0).map(i => React.createRef()), [data.length])

  const triggerSwipe = (dir, index) => {
    gone.add(index);
    const item = data[index];
    onSwipe(dir === 1 ? 'right' : 'left', item.id);
    api.start(i => {
      if (index !== i) return;
      const x = (200 + window.innerWidth) * dir;
      const rot = dir * 10 * 1; // Simulate a swipe rotation
      return { x, rot, config: { friction: 50, tension: 200 } };
    });
    if (gone.size === data.length) {
      setTimeout(() => {
        gone.clear();
        api.start(i => to(i));
      }, 600);
    }
  };

  const bind = useDrag(({ args: [index], down, movement: [mx], direction: [xDir], velocity: [vx] }) => {
    const trigger = vx > 0.2
    const dir = xDir < 0 ? -1 : 1
    if (!down && trigger) {
      triggerSwipe(dir, index);
    }

    api.start(i => {
      if (index !== i) return
      const isGone = gone.has(index)
      const x = isGone ? (200 + window.innerWidth) * dir : down ? mx : 0
      const rot = mx / 100 + (isGone ? dir * 10 * vx : 0)
      const scale = down ? 1.1 : 1
      return {
        x,
        rot,
        scale,
        delay: undefined,
        config: { friction: 50, tension: down ? 800 : isGone ? 200 : 500 },
      }
    })
  })

  return (
    <>
      <div className='cardContainer'>
        {props.map(({ x, y, rot, scale }, i) => {
          const item = data[i];
          const isLoad = !item.trucker;
          return (
            <animated.div className="deck" key={i} style={{ x, y }}>
              <animated.div
                {...bind(i)}
                style={{
                  transform: interpolate([rot, scale], trans),
                }} >
                <div className='card'>
                  {isLoad ? (
                    <>
                      <h3>{item.origin} to {item.destination}</h3>
                      <p>Weight: {item.weight} lbs</p>
                      <p>Budget: ${item.budget}</p>
                      <p>Deadline: {new Date(item.deadline).toLocaleDateString()}</p>
                    </>
                  ) : (
                    <>
                      <h5>Load: {item.load.origin} to {item.load.destination}</h5>
                      <p>Trucker: {item.trucker.name} ({item.trucker.email})</p>
                      <p>Status: {item.status}</p>
                      <Link to={`/reviews/${item.trucker.id}`} className="btn btn-info btn-sm mt-2">View Reviews</Link>
                    </>
                  )}
                  <div className="buttons">
                    <button style={{ backgroundColor: '#FF6347' }} onClick={() => triggerSwipe(-1, i)}>Decline</button>
                    <button style={{ backgroundColor: '#2E8B57' }} onClick={() => triggerSwipe(1, i)}>Accept</button>
                  </div>
                </div>
              </animated.div>
            </animated.div>
          )
        })}
      </div>
    </>
  )
}

export default Deck;