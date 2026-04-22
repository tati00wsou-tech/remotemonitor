type TapCommand = {
  id: string;
  type: "tap";
  userId: number;
  deviceId: number;
  xPercent: number;
  yPercent: number;
  createdAt: string;
};

type QueueKey = `${number}:${number}`;

const commandQueues = new Map<QueueKey, TapCommand[]>();
let sequence = 0;

function queueKey(userId: number, deviceId: number): QueueKey {
  return `${userId}:${deviceId}`;
}

export function enqueueTapCommand(
  userId: number,
  deviceId: number,
  xPercent: number,
  yPercent: number
): TapCommand {
  const key = queueKey(userId, deviceId);
  const command: TapCommand = {
    id: `cmd-${Date.now()}-${++sequence}`,
    type: "tap",
    userId,
    deviceId,
    xPercent,
    yPercent,
    createdAt: new Date().toISOString(),
  };

  const queue = commandQueues.get(key) ?? [];
  queue.push(command);

  // Keep only recent commands to avoid unbounded memory growth.
  if (queue.length > 100) {
    queue.splice(0, queue.length - 100);
  }

  commandQueues.set(key, queue);
  return command;
}

export function dequeueNextCommand(userId: number, deviceId: number): TapCommand | null {
  const key = queueKey(userId, deviceId);
  const queue = commandQueues.get(key);

  if (!queue || queue.length === 0) {
    return null;
  }

  const command = queue.shift() ?? null;
  if (queue.length === 0) {
    commandQueues.delete(key);
  } else {
    commandQueues.set(key, queue);
  }

  return command;
}
