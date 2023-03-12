// Seria um utilitário que armazenaria todos os Comandos de um contexto
// Proposito: Criação de controladores que possuem os Comandos
// Proposito: Método encapsulado com interface simples e que não precisa de parametros
// Proposito: Abstração de métodos com maior acessibilidade e visando suporte multiplataforma
// Proposito: Suporte a delai, enfileiramento, etc...
// Ideia: disponibilizar uma API de plataforma para ajudar a criação de comandos
// Ideia: diminuir imports
// Ideia: passar um diretório para ser varrido todos os comandos

type Executable = () => unknown
class NoCommandError extends Error {}

export default class Commands {

    readonly #COMMANDS = new Map<string, Executable>()
    readonly #THROW_NO_COMMAND: boolean

    constructor(throwNoCommandError = true) {
        this.#THROW_NO_COMMAND = throwNoCommandError
    }

    add(command: string, executable: Executable) {
        this.#COMMANDS.set(command, executable)
    }

    invoke(command: string) {
        if (!this.#COMMANDS.has(command)) {
            if (this.#THROW_NO_COMMAND) throw new NoCommandError(`No Command for '${command}'`);
            return console.error(`No Command for '${command}'`)
        }
        this.#COMMANDS.get(command)()
    }
}

const commands = new Commands()
commands.add('a', () => console.log(1234))
commands.invoke('a')
commands.invoke('b')

// class KeyboardListener {
//     keyboardComands
//     pressedKeys = []
//     onKeydown(key) {
//         this.keyboardComands.invoke(this.pressedKeys.join('+'))
//     }
// }