(() => {
  const cards = Array.from(document.querySelectorAll('.menu-fan-card'));

  if (!cards.length) {
    return;
  }

  const baseTransforms = [
    'rotate(-18deg) translate(-18px, 12px)',
    'rotate(-4deg) translate(2px, 0)',
    'rotate(14deg) translate(22px, 14px)',
  ];

  const raisedTransforms = [
    'rotate(-15deg) translate(-18px, 0)',
    'rotate(-1deg) translate(2px, -13px)',
    'rotate(11deg) translate(22px, 2px)',
  ];

  const settleTransforms = [
    'rotate(-19deg) translate(-18px, 8px)',
    'rotate(-5deg) translate(2px, -3px)',
    'rotate(15deg) translate(22px, 10px)',
  ];

  cards.forEach((card, index) => {
    const animation = card.animate(
      [
        { transform: baseTransforms[index], offset: 0 },
        { transform: baseTransforms[index], offset: 0.60 },
        { transform: raisedTransforms[index], offset: 0.74 },
        { transform: settleTransforms[index], offset: 0.86 },
        { transform: baseTransforms[index], offset: 1 },
      ],
      {
        duration: 4100,
        delay: index * 120,
        iterations: Infinity,
        easing: 'ease-in-out',
      },
    );

    animation.play();
  });
})();
