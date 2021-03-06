import React, {useState, useEffect} from "react";
import Input from "../Forms/Input";
import Textarea from "../Forms/Textarea";
import Button from "../Forms/Button";
import Error from "../Helper/Error";
import useForm from "../../Hooks/useForm";
import {Alert} from "react-st-modal";
import Select from "../Forms/Select";
import useFetch from "../../Hooks/useFetch";
import {useNavigate} from "react-router-dom";
import {RiAddBoxFill} from "react-icons/all";
import {FaWindowClose} from "react-icons/fa";
import {UserContext} from '../../Contexts/UserContext';
import {SENDMAIL_POST} from "../../API/Api_SendMail";
import {TEAM_FILTER, TEAM_FILTER_STUDENTS, TEAM_GET_STUDENTS} from "../../API/Api_Team";
import {PERSON_FILTER} from "../../API/Api_Person";

import {ACTIVITY_GET_PARTICIPANTS} from "../../API/Api_Activity";
import axios from "axios";
import styles from "../Person/Person.module.css";
import {bloqueiaTela, liberaTela} from "../Helper/Functions";

const SendMailCreate = () => {
    const [idPersons, setIdPerson] = useState([]);
    const message = useForm();
    const navigate = useNavigate();

    const {loading, error} = useFetch();
    const [objErros, setObjErros] = useState({});

    const [nameFiltro, setNameFiltro] = useState("");
    const [typeFiltro, setTypeFiltro] = useState(0);
    const [teamFiltro, setTeamFiltro] = useState(0);
    const {userLogged, token} = React.useContext(UserContext);

    const types = [
        {id: 3, description: "Aluno"},
        {id: 1, description: "Professor"},
        {id: 2, description: "Responsável"},
    ];

    const [teams, setTeams] = useState([]);

    const [pessoasFiltro, setPessoasFiltro] = useState([]);
    const [pessoasAtividade, setPessoasAtividade] = useState([]);

    useEffect(() => {
        async function getTeams() {
            bloqueiaTela();

            const {url, options} = TEAM_FILTER({status_id: 1}, token);
            const response = await axios.get(url, options);
            setTeams(response.data);

            liberaTela();
        }

        let select = document.getElementById("type");
        types.map((type) => {
            let option = new Option(type.description, type.id);
            select.add(option);
        });

        getTeams();
    }, []);

    useEffect(() => {
        let select = document.getElementById("team");
        teams.map((team) => {
            let option = new Option(team.name + " (" + team.year + ")", team.id);
            select.add(option);
        });
    }, [teams]);

    async function filtraPessoas() {
        bloqueiaTela();

        let getParamentes = PERSON_FILTER({name: nameFiltro,type_id: typeFiltro},token);

        if (teamFiltro > 0) {
            getParamentes = TEAM_FILTER_STUDENTS(teamFiltro,{name: nameFiltro}, token);
        }

        let {url, options} = getParamentes;
        const response = await axios.get(url, options);

        let dados = {};
        if (teamFiltro > 0 && response.data.length) {
            //- Quando o filtro eh por turma o retorno da API tem um formato diferente, entao vamos ter que organizar os dados
            let persons = [];
            for (let i = 0; i < response.data.length; i++) {
                persons.push(response.data[i].student.person);
            }
            dados = persons;
        } else {
            dados = response.data;
        }

        setPessoasFiltro(dados);

        liberaTela();
    }

    const activity_id = new URL(window.location.href).searchParams.get("activity");
    const team_id = new URL(window.location.href).searchParams.get("team");

    useEffect(() => {
        async function getActivityData() {
            bloqueiaTela();

            const {url, options} = ACTIVITY_GET_PARTICIPANTS(activity_id, token);
            const response = await axios.get(url, options);

            const inscricoes = response.data
            const pessoas = []
            for (let i = 0; i < inscricoes.length; i++) {
                pessoas.push(inscricoes[i].person)
            }
            setIdPerson(pessoas)

            liberaTela();
        }

        async function getTeamData() {
            bloqueiaTela();

            const {url, options} = TEAM_GET_STUDENTS(team_id, token);
            const response = await axios.get(url, options);
            const alunos = response.data;
            const responsaveis = [];

            for(let i = 0; i < alunos.length; i++){
                if (!isPersonInArray(responsaveis,alunos[i].responsible.person)) {
                    responsaveis.push(alunos[i].responsible.person);
                }
            }

            setIdPerson(responsaveis);

            liberaTela();
        }

        if (activity_id){
            getActivityData();
        } else if (team_id) {
            getTeamData();
        }
    }, [token]);

    function isPersonInArray(array, responsible) {
        for (let i = 0; i < array.length; i++) {
            if (array[i].id == responsible.id) {
                return true;
            }
        }

        return false;
    }

    function addPessoa(id) {
        if (id <= 0 || !pessoasFiltro.length) return;

        pessoasFiltro.map((pessoa) => {
            if (pessoa.id === id) {
                if (isPersonInArray(idPersons, pessoa)) {
                    return;
                }

                let pessoas = [...idPersons];
                pessoa.inActivity = false;
                pessoas.push(pessoa);

                // pessoas = ordernarPessoasAtividade(pessoas);
                setIdPerson(pessoas);
            }
        });
    }

    function removePessoa(id) {
        if (id <= 0 || !idPersons.length) return;

        for (let i = 0; i < idPersons.length; i++) {
            if (idPersons[i].id === id) {
                let pessoas = [...idPersons];
                pessoas.splice(i, 1);
                setIdPerson(pessoas);
                break;
            }
        }
    }

    useEffect(() => {
        modalError();
    }, [objErros]);

    async function handleSubmit(event) {
        event.preventDefault();
        bloqueiaTela();

        const {url, body, options} = SENDMAIL_POST({
            message: message.value,
            send_email: document.getElementById("send_email").checked,
            send_whatsapp: document.getElementById("send_whatsapp").checked,
            destinatarios: idPersons
        }, userLogged, token);

        const response = await axios.post(url, body, options);

        if (response.statusText === "OK") {
            if (response.data.erros !== undefined && response.data.erros.length) {
                let erros = {msg: response.data.success, erros: []};
                for (let i = 0; i < response.data.erros.length; i++) {
                    erros.erros.push(response.data.erros[i]);
                }
                setObjErros(erros);
                modalError();
            } else {
                navigate("/conta/sendmail");
            }
        }

        liberaTela();
    }

    async function modalError() {
        if (Object.keys(objErros).length > 0) {
            await Alert(
                objErros.erros.map((val, key) => (
                    <li key={key}>
                        <Error error={val}/>
                    </li>
                )),
                objErros.msg
            );
            setObjErros("");
        }
    }

    return (
        <section className="animeLeft">
            <h1 className="title title-2">Cadastro de mensagens</h1>
            <div className="container100">
                <Textarea label="Mensagem" rows="7" {...message}/>
                {/*<Input label="E-mail" type="text" {...message} />*/}

                <div className={styles.checkbox}>
                    <Input label="Enviar por e-mail" type="checkbox" name="send_email" id="send_email"
                           defaultChecked={true}/>
                    <Input label="Enviar por WhatsApp" type="checkbox" name="send_whatsapp" id="send_whatsapp"/>
                </div>
            </div>

            <div className="container100">
                <h2 className="title title-h2">Destinatários</h2>

                <div className="containerFiltro">
                    <h3 className="mb-5">Filtro de destinatários</h3>

                    <div className="container40">
                        <Input
                            label="Nome"
                            type="text"
                            onChange={(e) => {
                                setNameFiltro(e.target.value);
                            }}
                        />
                    </div>

                    <div className="container20">
                        <Select
                            label="Tipo"
                            name="type"
                            primeiraOpcao={{id: 0, name: ":: TODOS ::"}}
                            onChange={(e) => {
                                setTypeFiltro(e.target.value);
                            }}
                        />
                    </div>

                    <div className="container20">
                        <Select
                            label="Turma"
                            name="team"
                            primeiraOpcao={{id: 0, name: ":: TODAS ::"}}
                            onChange={(e) => {
                                setTeamFiltro(e.target.value);
                            }}
                        />
                    </div>

                    <div className="container20">
                        <label>&nbsp;</label>
                        <Button type="button" onClick={filtraPessoas}>
                            Buscar
                        </Button>
                    </div>
                </div>
            </div>

            <div className="container100 mt-30">
                <div className="container50 mb-30">
                    <h3 className="mb-5">Pessoas filtradas</h3>
                    {pessoasFiltro.length ? (
                        <table>
                            <thead>
                            <tr>
                                <th>Nome</th>
                                {/*<th>CPF</th>*/}
                                <th>Tipo</th>
                                <th></th>
                            </tr>
                            </thead>
                            <tbody>
                            {pessoasFiltro.map((pessoa) => (
                                <tr key={pessoa.id}>
                                    <td>{pessoa.name}</td>
                                    {/*<td>{formataCPF(pessoa.cpf)}</td>*/}
                                    <td>{pessoa.type.description}</td>
                                    <td>
                                        <RiAddBoxFill
                                            className="cursor-pointer"
                                            onClick={() => {
                                                addPessoa(pessoa.id);
                                            }}
                                            size={16}
                                            style={{color: "green"}}
                                        />
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    ) : (
                        "Nenhuma pessoa encontrada"
                    )}
                </div>

                <div className="container50 mb-30">
                    <h3 className="mb-5">Destinatários</h3>
                    {idPersons.length ? (
                        <table>
                            <thead>
                            <tr>
                                <th>Nome</th>
                                {/*<th>CPF</th>*/}
                                <th>Tipo</th>
                                <th></th>
                            </tr>
                            </thead>
                            <tbody>
                            {idPersons.map((pessoa) => (
                                <tr key={pessoa.id}>
                                    <td>{pessoa.name}</td>
                                    {/*<td>{formataCPF(pessoa.cpf)}</td>*/}
                                    <td>{pessoa.type.description}</td>
                                    <td>
                                        <FaWindowClose
                                            onClick={() => {
                                                removePessoa(pessoa.id);
                                            }}
                                            className="cursor-pointer"
                                            size={16}
                                            style={{color: "red"}}
                                        />
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    ) : (
                        "Nenhum destinatário adicionado"
                    )}
                </div>

            </div>

            <div className="container100 my-30">
                {loading ? (
                    <Button disabled>Salvando...</Button>
                ) : (
                    <Button onClick={handleSubmit}>Salvar mensagem</Button>
                )}
                <Error error={error && ""}/>
                {Object.keys(objErros).length > 0 ? (
                    <>
                        <b>
                            <Error error={objErros.msg}/>
                        </b>
                        {objErros.erros.map((val, key) => (
                            <li key={key}>
                                <Error error={val}/>
                            </li>
                        ))}
                    </>
                ) : (
                    ""
                )}
            </div>
        </section>
    );
};

export default SendMailCreate;
