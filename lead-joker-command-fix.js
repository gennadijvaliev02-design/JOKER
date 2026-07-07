(() => {
  const originalChooseLeadJokerAction = chooseLeadJokerAction;

  chooseLeadJokerAction = function fixedLeadJokerAction(playerId) {
    const action = originalChooseLeadJokerAction(playerId);

    if (playerId !== "human" && shouldPlayerTakeTrick(playerId)) {
      return {
        ...action,
        jokerCommand: "high",
      };
    }

    return action;
  };
})();
