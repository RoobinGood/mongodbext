'use strict';

var expect = require('expect.js'),
	Steppy = require('twostep').Steppy,
	helpers = require('./helpers');

describe('Test deleteMany', function() {

	before(helpers.dbConnect);

	describe('promise functionality', function() {
		var collection;

		before(function() {
			collection = helpers.getCollection();
		});

		it('without callback should return a Promise', function() {
			expect(collection.deleteMany(
				helpers.getEntity()
			)).to.be.a(Promise);
		});

		after(helpers.cleanDb);
	});

	describe('returnResultOnly option', function() {
		var collection,
			condition = {
				_id: 1
			};

		before(function() {
			collection = helpers.getCollection();
		});

		it('should be set true by default', function(done) {
			Steppy(
				function() {
					collection.deleteMany(condition, this.slot());
				},
				function(err, result) {
					expect(result).ok();
					expect(result).only.keys('deletedCount');
					this.pass(null);
				},
				done
			);
		});

		it('should correctly process "true" value', function(done) {
			Steppy(
				function() {
					collection.deleteMany(condition, {
						returnResultOnly: true
					}, this.slot());
				},
				function(err, result) {
					expect(result).ok();
					expect(result).only.keys('deletedCount');
					this.pass(null);
				},
				done
			);
		});

		it('should correctly process "false" value', function(done) {
			Steppy(
				function() {
					collection.deleteMany(condition, {
						returnResultOnly: false
					}, this.slot());
				},
				function(err, result) {
					expect(result).ok();
					expect(result).have.keys(
						'connection', 'result', 'deletedCount'
					);
					this.pass(null);
				},
				done
			);
		});

		after(helpers.cleanDb);
	});

	describe('hooks', function() {

		it('without hooks, should be ok', function(done) {
			var entities = [helpers.getEntity(), helpers.getEntity()],
				condition = {
					_id: {
						$in: [entities[0]._id, entities[1]._id]
					}
				},
				collection = helpers.getCollection();
			Steppy(
				function() {
					collection.insertMany(entities, this.slot());
				},
				function() {
					collection.deleteMany(condition, this.slot());
				},
				function() {
					collection.findOne(this.slot());
				},
				function(err, result) {
					expect(result).not.ok();

					helpers.cleanDb(this.slot());
				},
				done
			);
		});

		it('with before hook, should be ok', function(done) {
			var entities = [helpers.getEntity(), helpers.getEntity()],
				hookEntity = helpers.getEntity(),
				condition = {
					_id: {
						$in: [entities[0]._id, entities[1]._id]
					}
				},
				collection = helpers.getCollection({
					beforeDeleteMany: function(params, callback) {
						expect(params.condition).eql(condition);
						expect(params.options).eql({});
						collection.insertOne(hookEntity, callback);
					}
				});
			Steppy(
				function() {
					collection.insertMany(entities, this.slot());
				},
				function() {
					collection.deleteMany(condition, this.slot());
				},
				function() {
					collection.find().toArray(this.slot());
				},
				function(err, result) {
					expect(result).ok();
					expect(result).length(1);
					expect(result).eql([hookEntity]);

					helpers.cleanDb(this.slot());
				},
				done
			);
		});

		it('with after hook, should be ok', function(done) {
			var entities = [helpers.getEntity(), helpers.getEntity()],
				hookEntity = helpers.getEntity(),
				condition = {
					_id: {
						$in: [entities[0]._id, entities[1]._id]
					}
				},
				collection = helpers.getCollection({
					afterDeleteMany: function(params, callback) {
						expect(params.condition).eql(condition);
						expect(params.options).eql({});
						expect(params.result).an('object');
						expect(params.result).only.keys('deletedCount');
						collection.insertOne(hookEntity, callback);
					}
				});
			Steppy(
				function() {
					collection.insertMany(entities, this.slot());
				},
				function() {
					collection.deleteMany(condition, this.slot());
				},
				function() {
					collection.find().toArray(this.slot());
				},
				function(err, result) {
					expect(result).ok();
					expect(result).length(1);
					expect(result).eql([hookEntity]);

					helpers.cleanDb(this.slot());
				},
				done
			);
		});

		it('with error hook, should be ok', function(done) {
			var entities = [helpers.getEntity(), helpers.getEntity()],
				condition = {
					_id: {
						$in: [entities[0]._id, entities[1]._id]
					}
				},
				collection = helpers.getCollection({
					beforeDeleteMany: helpers.beforeHookWithError,
					error: function(params, callback) {
						expect(params.condition).eql(condition);
						expect(params.options).eql({});
						expect(params.method).eql('deleteMany');
						expect(params.namespace).eql(helpers.getNamespace());
						expect(params.error).ok();

						params.error.hookCalled = true;
						callback();
					}
				});
			Steppy(
				function() {
					collection.insertMany(entities, this.slot());
				},
				function() {
					collection.deleteMany(condition, this.slot());
				},
				function(err) {
					expect(err).ok();
					expect(err.message).eql(helpers.beforeHookErrorMessage);
					expect(err.hookCalled).ok();

					Steppy(
						function() {
							collection.count(this.slot());
						},
						function(err, count) {
							expect(count).eql(2);

							helpers.cleanDb(this.slot());
						},
						done
					);
				}
			);
		});
	});

	after(helpers.cleanDb);
});
