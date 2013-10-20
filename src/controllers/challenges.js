// @see ../routes for routing

var _ = require('lodash');
var nconf = require('nconf');
var async = require('async');
var algos = require('habitrpg-shared/script/algos');
var helpers = require('habitrpg-shared/script/helpers');
var items = require('habitrpg-shared/script/items');
var User = require('./../models/user').model;
var Group = require('./../models/group').model;
var Challenge = require('./../models/challenge').model;
var api = module.exports;

/*
  ------------------------------------------------------------------------
  Challenges
  ------------------------------------------------------------------------
*/

// GET
// 1.populate (group, leader, members)

// CREATE
// 1. create challenge with refs (group, leader) @see http://mongoosejs.com/docs/populate.html

// UPDATE
// 1. update challenge
// 2. update subscribed users' tasks

// DELETE
// 1. update challenge
// 2. update sub'd users' tasks

// SUBSCRIBE
// UNSUBSCRIBE
