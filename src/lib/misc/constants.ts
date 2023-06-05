import { Subjects } from '../classes/Test'

export const APP_NAME = 'Tester'

export const APP_DESCRIPTION =
    'Tester - уникальная платформа для создания тестов. ' +
    'Тесты, ответы, удобный редактор, статистика прохождений, ' +
    'большая библиотека и многое другое позволят сделать обучение ещё лучше!'

export const APP_KEYWORDS = [
    'тесты', 'tests', 'тест', 'test',
    'редактор', 'editor', 'редактор тестов', 'tests editor',
    'школа', 'school', 'обучение', 'education',
    'задания', 'tasks', 'задание', 'task',
    'ответы', 'answers', 'ответ', 'answer',
    'учитель', 'teacher', 'учителя', 'teachers',
    'профессор', 'professor', 'преподаватель', 'educationalist',
    'домашнее задание', 'hometask', 'home task', 'домашняя работа',
    'экзамен', 'exam', 'контрольная работа', 'control work',
    'контроль', 'control', 'котрольная', 'final exam',
    'финальный экзамен', 'итоговый экзамен', 'финальная работа',
    'final control work', 'итоговая контрольная работа', 'итоговая работа',
    'ЕГЭ', 'ОГЭ', 'ГИА', 'ГВЭ', 'аттестация', 'attestation',
    'home work', 'homework', 'online', 'онлайн', 'проект', 'project',
    'tester', 'тестер', 'легкий', 'лёгкий', 'individual project',
    'простой', 'понятный', 'easy', 'simple', 'индивидуальный проект',
    'easy to understand', 'настраиваемый', 'customizable', 'customisable',
    'library', 'tests library', 'big tests library', 'huge tests library',
    'big', 'huge', 'большой', 'огромный',
    'большая', 'огромная', 'библиотека',
    'библиотека тестов', 'большая библиотека тестов',
    'огромная библиотека тестов',
    'классная работа', 'class work', 'classwork', 'work', 'работа',
    '9 класс', '10 класс', '11 класс', 'grade 9', 'grade 10', 'grade 11',
    '9th grade', '10th grade', '11th grade'
]

export const subjectsStrings: { [key: number]: string } = {
    [Subjects.ENGLISH]: 'Английский язык',
    [Subjects.ALGEBRA]: 'Алгебра',
    [Subjects.BIOLOGY]: 'Биология',
    [Subjects.GEOMETRY]: 'Геометрия',
    [Subjects.GEOGRAPHY]: 'География',
    [Subjects.HISTORY]: 'История',
    [Subjects.INFORMATICS]: 'Информатика',
    [Subjects.MATHS]: 'Математика',
    [Subjects.SOCIALS]: 'Обществознание',
    [Subjects.RUSSIAN]: 'Русский язык',
    [Subjects.PHYSICS]: 'Физика',
    [Subjects.CHEMISTRY]: 'Химия',
    [Subjects.OTHER]: 'Другое'
}

export const API_VERSION = 1
export const API_URL = `/api/v${API_VERSION}`

export const DATABASE_CONNECTED_STATE = 1

export const statusCodes = {
    200: 'OK',
    201: 'Created',
    202: 'Accepted',
    203: 'Non-Authoritative Information',
    204: 'No Content',

    304: 'Not Modified',

    400: 'Bad Request',
    401: 'Unauthorized',
    402: 'Payment Required',
    403: 'Forbidden',
    404: 'Not Found',
    405: 'Method Not Allowed',
    406: 'Not Acceptable',
    408: 'Request Timeout',
    409: 'Conflict',
    410: 'Gone',
    413: 'Request Entity Too Large',
    415: 'Unsupported Media Type',
    418: 'I\'m a Teapot',
    422: 'Unprocessable Entity',
    423: 'Locked',
    429: 'Too Many Requests',
    451: 'Unavailable For Legal Reasons',

    500: 'Internal Server Error',
    501: 'Not Implemented',
    503: 'Service Unavailable'
}

export const consoleColors = {
    black: '\x1b[30m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    white: '\x1b[97m',
    default: '\x1b[39m',
    lightGray: '\x1b[37m',
    darkGray: '\x1b[90m',
    lightRed: '\x1b[91m',
    lightGreen: '\x1b[92m',
    lightYellow: '\x1b[93m',
    lightBlue: '\x1b[94m',
    lightMagenta: '\x1b[95m',
    lightCyan: '\x1b[96m',
    reset: '\x1b[0m'
}
