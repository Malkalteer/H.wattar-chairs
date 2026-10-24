const mongoose = require('mongoose');

// الصور تُخزَّن داخل MongoDB نفسها (GridFS) في المجموعتين images.files و images.chunks
const BUCKET_NAME = 'images';

const getBucket = () => {
  if (!mongoose.connection.db) {
    throw new Error('قاعدة البيانات غير متصلة.');
  }
  return new mongoose.mongo.GridFSBucket(mongoose.connection.db, { bucketName: BUCKET_NAME });
};

const saveBuffer = (filename, buffer, contentType) =>
  new Promise((resolve, reject) => {
    const stream = getBucket().openUploadStream(filename, { metadata: { contentType } });
    stream.once('error', reject);
    stream.once('finish', () => resolve(stream.id));
    stream.end(buffer);
  });

const findByName = async (filename) => {
  const files = await getBucket().find({ filename }).sort({ uploadDate: -1 }).limit(1).toArray();
  return files[0] || null;
};

const openStream = (filename) => getBucket().openDownloadStreamByName(filename);

const deleteByName = async (filename) => {
  const bucket = getBucket();
  const files = await bucket.find({ filename }).toArray();
  for (const file of files) {
    await bucket.delete(file._id);
  }
  return files.length;
};

module.exports = { saveBuffer, findByName, openStream, deleteByName, BUCKET_NAME };
