// Optional mongosh companion for the MongoDB lab concepts.
// Run the insertMany block once, then run the queries as a teaching demo.
use('campus_care_mongo');

// CREATE: documents represent campus maintenance requests.
db.requests.insertMany([
  { _id: 7001, title: 'Projector will not turn on', requester: 'Aarav Mehta', category: 'Electrical', location: 'Room B-204', priority: 'High', status: 'Open' },
  { _id: 7002, title: 'Water leak near washbasin', requester: 'Nisha Rao', category: 'Plumbing', location: 'Science Block, Floor 1', priority: 'High', status: 'In Progress' },
  { _id: 7003, title: 'Wi-Fi signal is weak', requester: 'Kabir Shah', category: 'Network', location: 'Library, Reading Area', priority: 'Medium', status: 'Open' },
  { _id: 7004, title: 'Broken chair needs repair', requester: 'Isha Kulkarni', category: 'Furniture', location: 'Room A-105', priority: 'Low', status: 'Resolved' },
  { _id: 7005, title: 'Corridor light is flickering', requester: 'Dev Patil', category: 'Electrical', location: 'Main Building, Floor 2', priority: 'Medium', status: 'Open' }
]);

// READ: show open, high-priority requests and choose the fields to display.
db.requests.find({ status: 'Open', priority: 'High' }, { title: 1, location: 1, _id: 0 });

// Logical operators: all conditions, any condition, NOT, and NOR.
db.requests.find({ $and: [{ category: 'Electrical' }, { status: 'Open' }] });
db.requests.find({ $or: [{ priority: 'High' }, { location: /Library/ }] });
db.requests.find({ status: { $not: { $eq: 'Resolved' } } });
db.requests.find({ $nor: [{ category: 'Electrical' }, { priority: 'Low' }] });

// UPDATE: mark one ticket as resolved.
db.requests.updateOne({ _id: 7001 }, { $set: { status: 'Resolved' } });

// DELETE: uncomment to remove the sample ticket after demonstrating the other operations.
// db.requests.deleteOne({ _id: 7004 });

// AGGREGATION: count requests and high-priority unresolved requests by category.
db.requests.aggregate([
  { $group: {
    _id: '$category',
    requestCount: { $sum: 1 },
    urgentCount: { $sum: { $cond: [{ $and: [{ $eq: ['$priority', 'High'] }, { $ne: ['$status', 'Resolved'] }] }, 1, 0] } }
  } },
  { $sort: { requestCount: -1 } }
]);

// INDEX: MongoDB already has a unique index on _id; add indexes for common filters.
db.requests.createIndex({ category: 1, status: 1 });
db.requests.createIndex({ priority: 1 });
db.requests.getIndexes();
