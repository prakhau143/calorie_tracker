export function Icon({ name, size = 18, className }) {
  return (
    <svg className={`icon${className ? ` ${className}` : ''}`} width={size} height={size} aria-hidden="true" focusable="false">
      <use href={`/icons/sprite.svg#${name}`} />
    </svg>
  );
}
