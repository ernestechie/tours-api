const AppError = require('../utils/appError');
const { catchErrorAsync } = require('./errorController');

exports.deleteOne = (Model) =>
  catchErrorAsync(async (req, res, next) => {
    const { params } = req;

    const document = await Model.findByIdAndDelete(params.id);

    if (!document) {
      return next(new AppError('No document found with this id', 404));
    }

    res.status(204).json({
      status: 'success',
      message: 'Deleted successsfully',
      data: null,
    });
  });

exports.updateOne = (Model) =>
  catchErrorAsync(async (req, res, next) => {
    const { params, body, requestTime } = req;

    const document = await Model.findByIdAndUpdate(params.id, body, {
      new: true,
      runValidators: true,
    });

    if (!document) {
      return next(new AppError('No document found with this id', 404));
    }

    res.status(200).json({
      status: 'success',
      data: { data: document, requestTime },
      message: 'Document updated successsfully',
    });
  });
