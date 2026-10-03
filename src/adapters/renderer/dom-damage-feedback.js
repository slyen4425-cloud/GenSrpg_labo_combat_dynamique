function requiredFunction(value, field) {
  if (typeof value !== "function") {
    throw new TypeError(
      field + " must be a function"
    );
  }
  return value;
}

export function createDomDamageFeedbackRenderer({
  targetFor
}) {
  const resolveTarget = requiredFunction(
    targetFor,
    "targetFor"
  );

  const activeByActor = new Map();
  let disposed = false;

  function cleanup(actorId, record) {
    if (
      activeByActor.get(actorId) ===
      record
    ) {
      activeByActor.delete(actorId);
    }
  }

  function flash(
    actorId,
    {
      durationMs = 280
    } = {}
  ) {
    if (disposed) {
      return Object.freeze({
        status: "disposed",
        finished: Promise.resolve({
          status: "disposed"
        })
      });
    }

    const target =
      resolveTarget(actorId) ?? null;
    const image = target?.image ?? null;

    if (
      !image ||
      typeof image.animate !== "function"
    ) {
      return Object.freeze({
        status: "ignored",
        finished: Promise.resolve({
          status: "ignored"
        })
      });
    }

    const previous =
      activeByActor.get(actorId) ?? null;
    previous?.animation?.cancel?.();

    const animation = image.animate(
      [
        { opacity: 1 },
        { opacity: 0.32 },
        { opacity: 1 },
        { opacity: 0.45 },
        { opacity: 1 }
      ],
      {
        duration: Math.max(
          1,
          Number(durationMs) || 280
        ),
        easing: "linear",
        fill: "none"
      }
    );

    const record = {
      animation
    };
    activeByActor.set(
      actorId,
      record
    );

    const finished = Promise.resolve(
      animation.finished
    )
      .then(() => {
        cleanup(actorId, record);
        return {
          status: "finished"
        };
      })
      .catch((error) => {
        cleanup(actorId, record);
        if (
          error?.name === "AbortError"
        ) {
          return {
            status: "cancelled"
          };
        }
        throw error;
      });

    return Object.freeze({
      status: "running",
      animation,
      finished
    });
  }

  function dispose() {
    if (disposed) {
      return;
    }
    disposed = true;

    for (
      const record of
      activeByActor.values()
    ) {
      record.animation?.cancel?.();
    }
    activeByActor.clear();
  }

  return Object.freeze({
    flash,
    dispose,
    get activeCount() {
      return activeByActor.size;
    }
  });
}
