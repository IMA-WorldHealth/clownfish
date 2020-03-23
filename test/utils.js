const test = require('ava');
const utils = require('../utils');

test('#parseToAddress() is an identity if no parsing necessary', (t) => {
  const addr = 'support@bhi.ma';
  t.is(utils.parseToAddress(addr), addr);
});

test('#parseToAddress() parses an address if in the correct format', (t) => {
  const addr = 'jniles\'s Support Addres <support@bhi.ma>';
  t.is(utils.parseToAddress(addr), 'support@bhi.ma');
});

test('#parseSubjectLine() parses the subject line', (t) => {
  let subject = 'Test - A subvalue';
  const { normalizedStructure, normalizedReportName } = utils.parseSubjectLine(subject);
  t.is(normalizedStructure, 'test');
  t.is(normalizedReportName, 'a subvalue');

  subject = ' white -- SPACE ';
  let parts = utils.parseSubjectLine(subject);
  t.is(parts.normalizedStructure, 'white');
  t.is(parts.normalizedReportName, 'space');

  subject = ' Test -- A SUBVALUE ';
  parts = utils.parseSubjectLine(subject);
  t.is(parts.normalizedStructure, 'test');
  t.is(parts.normalizedReportName, 'a subvalue');

  subject = ' Test – A SuBVALUE ';
  parts = utils.parseSubjectLine(subject);
  t.is(parts.normalizedStructure, 'test');
  t.is(parts.normalizedReportName, 'a subvalue');
});
