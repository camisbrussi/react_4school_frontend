import React, { useState, useEffect} from "react";
import {UserContext} from "../../Contexts/UserContext";
import Input from "../Forms/Input";
import Button from "../Forms/Button";
import Error from "../Helper/Error";
import useForm from "../../Hooks/useForm";
import { Alert } from "react-st-modal";
import Select from "../Forms/Select";
import useFetch from "../../Hooks/useFetch";
import { useNavigate } from "react-router-dom";
import { RiAddBoxFill } from "react-icons/all";
import { FaWindowClose } from "react-icons/fa";

import { SENDMAIL_POST } from "../../API/Api_SendMail";
import { TEAM_FILTER, TEAM_FILTER_STUDENTS, TEAM_GET_STUDENTS } from "../../API/Api_Team";
import { PERSON_FILTER } from "../../API/Api_Person";


import { RESPONSIBLE_GET_STUDENT } from "../../API/Api_SendMail";
import axios from "axios";

const SendMailCreateResponsible = () => {
  const [idPersons, setIdPerson] = useState([]);
  const message = useForm();
  const navigate = useNavigate();

  const { loading, error } = useFetch();
  const [objErros, setObjErros] = useState({});
  const { userLogged, token} = React.useContext(UserContext);


  const [nameFiltro, setNameFiltro] = useState("");
  const [typeFiltro, setTypeFiltro] = useState(0);
  const [teamFiltro, setTeamFiltro] = useState(0);
  const [atividadeFiltro, setAtividadeFiltro] = useState("");

  const types = [
    { id: 3, description: "Aluno" },
    { id: 1, description: "Professor" },
    { id: 2, description: "Responsável" },
  ];

  const [teams, setTeams] = useState([]);

  const [pessoasFiltro, setPessoasFiltro] = useState([]);
  const [responsibleFiltro, setResponsibleFiltro] = useState([]);
  const [pessoasAtividade, setPessoasAtividade] = useState([]);

  useEffect(() => {
    async function getTeams() {
      //const token = window.localStorage.getItem("token");
      const { url, options } = TEAM_FILTER({ status_id: 1 }, token);

      const response = await axios.get(url, options);
      setTeams(response.data);
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
    //const token = window.localStorage.getItem("token");
    let getParamentes = PERSON_FILTER(
      {
        name: nameFiltro,
        type_id: typeFiltro,
      },
      token
    );

    if (teamFiltro > 0) {
      getParamentes = TEAM_FILTER_STUDENTS(
        teamFiltro,
        { name: nameFiltro },
        token
      );
    }

    let { url, options } = getParamentes;

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

    setResponsibleFiltro(dados);
  }

  const team_id = new URL(window.location.href).searchParams.get("team");

  useEffect(() => {
      async function getData() {

          const {url, options} = TEAM_GET_STUDENTS(team_id, token);
          const response = await axios.get(url, options);

          const alunos = response.data;
          const responsaveis = [];

         for(let i = 0; i < alunos.length; i++){
           responsaveis.push(alunos[i].responsible.person) 
           //= alunos[i].responsible.person
         }

         console.log(responsaveis)
         
         setIdPerson(responsaveis)
         
         /* const turma = response.data
          const responsibles = []
          for (let i = 0; i < turma.length; i++){
            responsibles.push(turma[i].person)
          }
          setIdPerson(responsibles)*/
      }
      getData();
  }, [token]);




  function addPessoa(id) {
    if (id <= 0 || !responsibleFiltro.length) return;

    responsibleFiltro.map((responsible) => {
      if (responsible.id === id) {
        let responsibles = [...idPersons];
        responsible.inActivity = false;
        responsibles.push(responsible);

        // pessoas = ordernarPessoasAtividade(pessoas);
        setIdPerson(responsibles);
      }
    });
  }


  function removePessoa(id) {
    if (id <= 0 || !pessoasAtividade.length) return;

    for (let i = 0; i < pessoasAtividade.length; i++) {
      if (pessoasAtividade[i].id === id) {
        let professores = [...pessoasAtividade];
        professores.splice(i, 1);
        setPessoasAtividade(professores);
        break;
      }
    }
  }
  useEffect(() => {
    modalError();
  }, [objErros]);

  async function handleSubmit(event) {
    event.preventDefault();
    const { url, body, options } = SENDMAIL_POST({
      message: message.value,
      destinatarios: idPersons,
    }, userLogged, token);

    const response = await axios.post(url, body, options);

    if (response.statusText === "OK") {
      if (response.data.erros !== undefined && response.data.erros.length) {
        let erros = { msg: response.data.success, erros: [] };
        for (let i = 0; i < response.data.erros.length; i++) {
          erros.erros.push(response.data.erros[i]);
        }
        setObjErros(erros);
        modalError();
      } else {
        navigate("/conta/sendmail");
        
      }
    }
  }

  async function modalError() {
    if (Object.keys(objErros).length > 0) {
      await Alert(
        objErros.erros.map((val, key) => (
          <li key={key}>
            <Error error={val} />
          </li>
        )),
        objErros.msg
      );
      setObjErros("");
    }
  }

  return (
    <section className="animeLeft">
      <h1 className="title title-2">Enviar e-mail</h1>
      <div className="container40">
        <Input label="E-mail" type="text" {...message} />
      </div>

      <br></br>
      <br></br>
      <br></br>
      <br></br>
      <br></br>
      <h1 className="title title-2">Adicionar destinatário</h1>

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
            primeiraOpcao={{ id: 0, name: ":: TODOS ::" }}
            onChange={(e) => {
              setTypeFiltro(e.target.value);
            }}
          />
        </div>

        <div className="container20">
          <Select
            label="Turma"
            name="team"
            primeiraOpcao={{ id: 0, name: ":: TODAS ::" }}
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

      <div className="container100 mt-30">
        <div className="container50 mb-30">
          <h3 className="mb-5">Pessoas filtradas</h3>
          {responsibleFiltro.length ? (
            <table>
              <thead>
                <tr>
                  <th>Nome</th>
                  {/*<th>CPF</th>*/}
                  {/* <th>Tipo</th> */}
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {responsibleFiltro.map((responsible) => (
                  <tr key={responsible.id}>
                    <td>{responsible.name}</td>
                    {/*<td>{formataCPF(pessoa.cpf)}</td>*/}
                    {/* <td>{responsible.type.name}</td> */}
                    <td>
                      <RiAddBoxFill
                        className="cursor-pointer"
                        onClick={() => {
                          addPessoa(responsible.id);
                        }}
                        size={16}
                        style={{ color: "green" }}
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
          <h3 className="mb-5">Participantes</h3>
          {idPersons.length ? (
            <table>
              <thead>
                <tr>
                  <th>Nome</th>
                  {/*<th>CPF</th>*/}
                  {/* <th>Tipo</th> */}
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {idPersons.map((responsible) => (
                  <tr key={responsible.id}>
                    <td>{responsible.name}</td>
                    {/*<td>{formataCPF(pessoa.cpf)}</td>*/}
                   {/* {/*} <td>{responsaveis.name}</td> */}
                    <td>
                      <FaWindowClose
                        onClick={() => {
                          removePessoa(responsible.id);
                        }}
                        className="cursor-pointer"
                        size={16}
                        style={{ color: "red" }}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            "Nenhum participante adicionado"
          )}
        </div>
      
      </div>

      <div className="container100 my-30">
        {loading ? (
          <Button disabled>Salvando...</Button>
        ) : (
          <Button onClick={handleSubmit}>Enviar e-mail</Button>
        )}
        <Error error={error && ""} />
        {Object.keys(objErros).length > 0 ? (
          <>
            <b>
              <Error error={objErros.msg} />
            </b>
            {objErros.erros.map((val, key) => (
              <li key={key}>
                <Error error={val} />
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

export default SendMailCreateResponsible;
