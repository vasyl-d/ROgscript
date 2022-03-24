from flask import Flask, request, Response
import re
import logging
logging.basicConfig(level=logging.DEBUG)
sym_len = 7

# -*- coding: utf-8 -*-
one_to_nineteen = (u'ноль', u'один', u'два', u'три', u'четыре', u'пять', u'шесть', u'семь', u'восемь', u'девять', u'десять', u'одиннадцать', u'двенадцать', u'тринадцать', u'четырнадцать', u'пятнадцать', u'шестнадцать', u'семнадцать', u'восемнадцать', u'девятнадцать')

decs = ('', u'десять', u'двадцать', u'тридцать', u'сорок', u'пятьдесят', u'шестьдесят', u'семьдесят', u'восемьдесят', u'девяносто')

hundreds = ('', u'сто', u'двести', u'триста', u'четыреста', u'пятьсот', u'шестьсот', u'семьсот', u'восемьсот', u'девятьсот')

thousands = ('', u'одна тысяча', u'две тысячи', u'три тысячи', u'четыре тысячи')


def _one_convert(integer):
    return one_to_nineteen[integer]


def _two_convert(integer, string):
    if integer in range(20):
        result = one_to_nineteen[integer]

    else:
        result = decs[int(string[0])]

        if string[1] != '0':
            result = u'%s %s' % (result, one_to_nineteen[int(string[1])])
    return result


def convert(string):
    length = len(string)
    integer = int(string)

    if length == 1:
        result = _one_convert(integer)

    elif length == 2:
        result = _two_convert(integer, string)

    elif length == 3:
        result = hundreds[int(string[0])]

        tail = string[-2:]

        if tail != '00':
            result = u'%s %s' % (result, convert(tail))

    elif length in range(4, 7):
        tail = convert(string[-3:])

        str_head = string[:-3]
        int_head = int(str_head)

        if int_head in range(1, 5):
            head = thousands[int_head]

        else:
            head = u'%s тысяч' % (convert(str_head))

        result = u'%s %s' % (head, tail)

    else:
        result = ''

    return result.strip()


app = Flask(__name__)

svg_str = '''<?xml version="1.0" encoding="utf-8"?>
    <svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="{1}" height="14"><text font-size="12" y="1em" font-family="Helvetica">{0}</text></svg> '''

@app.route('/convert/<task_id>', methods=['GET'])
def str2svg(task_id):
    target_string = request.args.get('str')
    str_sanitaze = re.sub(r'''[^-\d+.]''','',target_string)
    l=200
    if str_sanitaze == '':
      str_sanitaze = '0'
    if task_id == 'en':
        l = len(str_sanitaze) * sym_len
        text_output = str_sanitaze
    elif task_id == 'ru':
        text_output = convert(str_sanitaze)
        l = len(text_output) * sym_len
    else :
        text_output = 'Unsupported operation'
    svg = svg_str.format(text_output, str(l))
    return Response(svg, mimetype='image/svg+xml;charset=UTF-8')

@app.route('/calc/', methods=['GET'])
def calculate():
    target_string = request.args.get('str')
    target_string = re.sub(r'''[^-()\d/*+.]''','',target_string)
    while target_string[0] in ['*','/']:
      target_string = target_string[1:]
    while target_string[-1] in ['*','/']:
      target_string = target_string[:-1]
    l = 200
    if target_string > '':
        text_output = strCalc(target_string)
    else:
        text_output = 'Unsupported operation'
    l = len(text_output) * sym_len
    svg = svg_str.format(text_output, str(l))
    return Response(svg, mimetype='image/svg+xml;charset=UTF-8')

def strCalc(target_string):
  str_sanitaze = re.sub(r'''[^-()\d/*+.]''','',target_string)
  try:
    eval_str = eval(str_sanitaze)
  except:
    eval_str = "error in formula"
  eval_str = str(eval_str)
  return(eval_str)

@app.route('/')
def welcome():
    text_output = '''Welcome!
    use svg calculator: /calc?str and %2B for + 
        %2A for * 
          - for -
        %2F for /
    use svg num2words converter /convert?str '''
    l = len(text_output) * sym_len
    svg = svg_str.format(text_output, str(l))
    return Response(svg, mimetype='image/svg+xml;charset=UTF-8')


if __name__ == '__main__':
    app.run(host="0.0.0.0")
#host="0.0.0.0"
