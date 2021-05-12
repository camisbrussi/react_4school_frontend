import React, { useEffect, useState } from "react";
import Head from "../Helper/Head";
import { FaEdit } from "react-icons/fa";
import { Link } from "react-router-dom";

import styles from "./SendMail.module.css";
import stylesBtn from "../Forms/Button.module.css";

import { SENDMAIL_GET } from "../../API/Api_SendMail";
import axios from "axios";
import { BsFillPersonLinesFill, BsPersonPlusFill } from "react-icons/all";

const SendMail = () => {
  const [sendMail, setSendMail] = useState([]);

  useEffect(() => {
    async function getData() {
      const { url, options } = SENDMAIL_GET();
      //console.log(url, options)
      const response = await axios.get(url, options);
      //console.log(response.data)
      setSendMail(response.data);
    }

    getData();
  }, []);

  return (
    <section className="animeLeft">
      <Head title="Enviar mensagem" />
      <h1 className="title title-2">E-mails</h1>
      <Link className={stylesBtn.button} to="createsendmail">
        Cadastrar
      </Link>

      <div className={styles.sendmail}>
        {sendMail.map((sendmail) => (
          <div key={String(sendmail.id)} className={styles.list}>
            console.log(sendmail)
            <span>{sendmail.message}</span>
            <span>Oi</span>
            <div className={styles.buttons}>
            <Link
                to={
                  `addsendmail?sendmail=` +
                  sendmail.id +
                  '&name=' +
                  sendmail.name +
                  '&year=' +
                  sendmail.year
                }
                title="Gerenciar alunos"
              >
                
              </Link>
             
              
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default SendMail;