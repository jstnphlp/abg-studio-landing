/** Deterministic decorative points: no canvas, random hydration, or animation loop. */
export function Starfield() {
  return (
    <div className="abg-stars" aria-hidden="true">
      {Array.from({ length: 64 }, (_, index) => (
        <span
          key={index}
          style={{
            left: `${(index * 73.79 + 7.13) % 100}%`,
            top: `${(index * 41.31 + 11.24) % 100}%`,
            width: index % 11 === 0 ? 2.5 : index % 3 === 0 ? 1.7 : 1,
            height: index % 11 === 0 ? 2.5 : index % 3 === 0 ? 1.7 : 1,
            animationDelay: `${(index % 13) * -0.48}s`,
            animationDuration: `${4 + (index % 7) * 0.7}s`,
          }}
        />
      ))}
    </div>
  );
}
