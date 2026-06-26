// MongoDB collection setup for SplitNest
// Run: mongosh splitnest mongodb/setup.js
// Or: mongosh "mongodb://127.0.0.1:27017/splitnest" mongodb/setup.js

const dbName = db.getName();

print(`Setting up SplitNest collections in database: ${dbName}`);

// ── Members ──
db.createCollection('members', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['id', 'name', 'email', 'avatar', 'joinedAt'],
      properties: {
        id: { bsonType: 'string' },
        name: { bsonType: 'string' },
        email: { bsonType: 'string' },
        avatar: { bsonType: 'string' },
        joinedAt: { bsonType: 'string' }
      }
    }
  }
});
db.members.createIndex({ id: 1 }, { unique: true });

// ── Groups ──
db.createCollection('groups', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['id', 'name', 'members'],
      properties: {
        id: { bsonType: 'string' },
        name: { bsonType: 'string' },
        description: { bsonType: 'string' },
        members: { bsonType: 'array', items: { bsonType: 'string' } },
        budgetLimit: { bsonType: 'double' }
      }
    }
  }
});
db.groups.createIndex({ id: 1 }, { unique: true });

// ── Expenses ──
db.createCollection('expenses', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['id', 'groupId', 'title', 'amount', 'date', 'category', 'paidBy', 'splitMethod', 'participants', 'createdAt', 'updatedAt'],
      properties: {
        id: { bsonType: 'string' },
        groupId: { bsonType: 'string' },
        title: { bsonType: 'string' },
        amount: { bsonType: 'double' },
        date: { bsonType: 'string' },
        category: { bsonType: 'string' },
        paidBy: { bsonType: 'string' },
        splitMethod: { enum: ['equal', 'quantity', 'percentage', 'exact', 'weighted'] },
        participants: { bsonType: 'array' },
        createdAt: { bsonType: 'string' },
        updatedAt: { bsonType: 'string' }
      }
    }
  }
});
db.expenses.createIndex({ id: 1 }, { unique: true });
db.expenses.createIndex({ groupId: 1, date: -1 });

// ── Settlement Records ──
db.createCollection('settlementrecords', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['id', 'groupId', 'from', 'to', 'amount', 'status', 'createdAt'],
      properties: {
        id: { bsonType: 'string' },
        groupId: { bsonType: 'string' },
        from: { bsonType: 'string' },
        to: { bsonType: 'string' },
        amount: { bsonType: 'double' },
        status: { enum: ['partial', 'settled'] },
        createdAt: { bsonType: 'string' }
      }
    }
  }
});
db.settlementrecords.createIndex({ id: 1 }, { unique: true });
db.settlementrecords.createIndex({ groupId: 1, from: 1, to: 1 });

// ── Activity Logs ──
db.createCollection('activitylogs', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['id', 'userId', 'action', 'entity', 'timestamp'],
      properties: {
        id: { bsonType: 'string' },
        groupId: { bsonType: 'string' },
        userId: { bsonType: 'string' },
        action: { bsonType: 'string' },
        entity: { bsonType: 'string' },
        timestamp: { bsonType: 'string' }
      }
    }
  }
});
db.activitylogs.createIndex({ id: 1 }, { unique: true });
db.activitylogs.createIndex({ groupId: 1, timestamp: -1 });

// ── Notifications ──
db.createCollection('notifications', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['id', 'title', 'body', 'createdAt', 'read'],
      properties: {
        id: { bsonType: 'string' },
        groupId: { bsonType: 'string' },
        title: { bsonType: 'string' },
        body: { bsonType: 'string' },
        read: { bsonType: 'bool' },
        createdAt: { bsonType: 'string' }
      }
    }
  }
});
db.notifications.createIndex({ id: 1 }, { unique: true });
db.notifications.createIndex({ groupId: 1, createdAt: -1 });

// ── Categories ──
db.createCollection('categories', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['id', 'name', 'type'],
      properties: {
        id: { bsonType: 'string' },
        name: { bsonType: 'string' },
        type: { enum: ['expense', 'income'] }
      }
    }
  }
});
db.categories.createIndex({ id: 1 }, { unique: true });
db.categories.createIndex({ name: 1 }, { unique: true });

print('SplitNest MongoDB collections and indexes created successfully.');
