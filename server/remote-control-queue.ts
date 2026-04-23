type TapCommand = {
  id: string;
  type: "tap";
  userId: number;
  deviceId: number;
  xPercent: number;
  yPercent: number;
  createdAt: string;
};

type LockCommand = {
  id: string;
  type: "lock" | "unlock";
  userId: number;
  deviceId: number;
  createdAt: string;
};

type DeviceCommand = TapCommand | LockCommand;

type QueueKey = `${number}:${number}`;

const commandQueues = new Map<QueueKey, DeviceCommand[]>();
let sequence = 0;

function queueKey(userId: number, deviceId: number): QueueKey {
  return `${userId}:${deviceId}`;
}

function enqueueCommand(command: DeviceCommand) {
  const key = queueKey(command.userId, command.deviceId);
  const queue = commandQueues.get(key) ?? [];
  queue.push(command);
  if (queue.length > 100) {
    queue.splice(0, queue.length - 100);
  }
  commandQueues.set(key, queue);
}

export function enqueueTapCommand(
  userId: number,
  deviceId: number,
  xPercent: number,
  yPercent: number
): TapCommand {
  const command: TapCommand = {
    id: `cmd-${Date.now()}-${++sequence}`,
    type: "tap",
    userId,
    deviceId,
    xPercent,
    yPercent,
    createdAt: new Date().toISOString(),
  };
  enqueueCommand(command);
  return command;
}

export function enqueueLockCommand(userId: number, deviceId: number): LockCommand {
  const command: LockCommand = {
    id: `cmd-${Date.now()}-${++sequence}`,
    type: "lock",
    userId,
    deviceId,
    createdAt: new Date().toISOString(),
  };
  enqueueCommand(command);
  return command;
}

export function enqueueUnlockCommand(userId: number, deviceId: number): LockCommand {
  const command: LockCommand = {
    id: `cmd-${Date.now()}-${++sequence}`,
    type: "unlock",
    userId,
    deviceId,
    createdAt: new Date().toISOString(),
  };
  enqueueCommand(command);
  return command;
}

export function dequeueNextCommand(userId: number, deviceId: number): DeviceCommand | null {
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

export function dequeueAllCommands(userId: number, deviceId: number): DeviceCommand[] {
  const key = queueKey(userId, deviceId);
  const queue = commandQueues.get(key) ?? [];
  commandQueues.delete(key);
  return queue;
}

