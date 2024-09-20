// query.sort().select().skip().limit()
class APIFeatures {
  constructor(query, queryString) {
    this.defaultPage = 1;
    this.defaultLimit = 10;
    this.query = query;
    this.queryString = queryString;
  }

  filter(excludedFields) {
    const queryObj = { ...this.queryString };

    excludedFields.forEach((field) => delete queryObj[field]);

    // Convert query object to query string
    let queryString = JSON.stringify(queryObj);
    queryString = queryString.replace(
      /\b(gte|gt|lte|lt)\b/g,
      (match) => `$${match}`,
    );

    this.query.find(JSON.parse(queryString));

    return this;
  }

  sort() {
    // This function sorts the API response with the query string, or by date if no sort field was passed in the query
    if (this.queryString.sort) {
      const sortBy = this.queryString.sort.split(',').join(' ');
      this.query = this.query.sort(sortBy);
    } else {
      this.query = this.query.sort('-createdAt');
    }

    return this;
  }

  limitFields() {
    // Limiting fields being sent to the API (Projecting Fields)
    if (this.queryString.fields) {
      const fields = this.queryString.fields.split(',').join(' ');
      this.query = this.query.select(fields);
    } else {
      this.query = this.query.select('-__v');
    }
    return this;
  }

  paginate() {
    if (!this.queryString.page || !this.queryString.limit)
      throw new Error("No value specified for 'page' or 'limit'");

    let limit = +this.queryString.limit;
    const page = +this.queryString.page || this.defaultPage;
    limit = limit && limit <= this.defaultLimit ? limit : this.defaultLimit;

    const skipRange = (page - 1) * limit;

    this.query = this.query.skip(skipRange).limit(limit);

    return this;
  }
}

module.exports = APIFeatures;
